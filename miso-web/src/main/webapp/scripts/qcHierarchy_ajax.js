var QcHierarchy = (function($) {

  var containerId = 'graphContainer';
  var scrollContainerX = '#graphScrollContainer';
  var scrollContainerY = 'html';
  var editContainer = '#editContainer';
  var editForm = '#editForm';
  var selectedLabel = '#selectedLabel';
  var typeLabel = '#selectedType';
  var statusInput = '#selectedStatus';
  var noteInput = '#selectedNote';
  var applyButton = '#applySelected'
  var chartMargin = 11; // (includes 1px border)
  var nodeWidth = 300;
  var nodeHeight = 80;
  var nodeSpacing = 10;
  var linkHeight = 30;

  var lightPurple = '#F0F0FF';
  var darkPurple = '#404087';
  var darkGrey = '#A9A9A9';

  var chartInstance = null;
  var selectedPoint = null;

  return {
    poolQcOptions: [{
      value: null,
      label: 'Not Ready'
    }, {
      value: true,
      label: 'Ready'
    }, {
      value: false,
      label: 'Failed'
    }],

    runLibraryQcOptions: [{
      value: null,
      label: 'Pending'
    }, {
      value: true,
      label: 'Passed'
    }, {
      value: false,
      label: 'Failed'
    }],

    buildGraph: function(hierarchy, selectedType, selectedId) {
      var maxLevelWidth = getMaxLevelWidth(hierarchy);
      var nodes = flattenHierarchy(hierarchy);
      var connections = getConnections(nodes);
      var depth = getMaxDepth(hierarchy);
      var chartWidth = (nodeWidth + nodeSpacing) * maxLevelWidth - nodeSpacing + chartMargin * 2;

      $('#' + containerId).css({
        width: chartWidth + 'px',
        minWidth: (nodeWidth + chartMargin * 2) + 'px'
      });

      chartInstance = Highcharts.chart(containerId, {
        chart: {
          height: (nodeHeight + linkHeight) * depth - linkHeight + chartMargin * 2,
          width: chartWidth,
          inverted: true
        },

        title: {
          text: '' // empty string removes the space normally reserved for the title
        },

        series: [{
          type: 'organization',
          keys: ['from', 'to'],
          data: connections,
          nodes: nodes,
          colorByPoint: false,
          color: lightPurple,
          states: {
            select: {
              color: lightPurple,
              borderColor: darkPurple
            }
          },
          dataLabels: {
            color: 'black',
            nodeFormatter: formatNode
          },
          borderColor: darkGrey,
          nodeWidth: nodeHeight, // For inverted (vertical) chart, 'nodeWidth' is actually the height
          events: {
            click: function(event) {
              if (!event.point.item) {
                return;
              }
              selectPoint(event.point);
            }
          }
        }],
        tooltip: {
          enabled: false
        }

      });

      selectPoint(chartInstance.series[0].nodes.find(function(node) {
        if (node.item.entityType !== selectedType) {
          return false;
        }
        if (selectedType === 'RunPartitionLibrary') {
          if (!Array.isArray(node.item.ids) || node.item.ids.length !== 3 || !Array.isArray(selectedId) || selectedId.length !== 3) {
            throw new Error("Invalid ID");
          }
          for (var i = 0; i < 3; i++) {
            if (node.item.ids[i] !== selectedId[i]) {
              return false;
            }
          }
          return true;
        } else {
          return node.item.id === selectedId;
        }
      }));

      // scroll selected item into view if necessary
      $(scrollContainerX).scrollLeft(selectedPoint.dataLabel.x + nodeWidth / 2 - $(scrollContainerX).width() / 2);
      if ($(scrollContainerX).position().top + selectedPoint.dataLabel.y + nodeHeight > $(window).height()) {
        $(scrollContainerY).scrollTop($(scrollContainerX).position().top + selectedPoint.dataLabel.y + nodeHeight / 2 - $(window).height() / 2);
      }
    }
  };

  function getMaxLevelWidth(item, level, allLevels) {
    var currentLevel = level || 0;
    var levels = allLevels || [];

    if (!levels[currentLevel]) {
      levels[currentLevel] = 0;
    }
    levels[currentLevel]++;
    if (item.children) {
      item.children.forEach(function(child) {
        getMaxLevelWidth(child, currentLevel + 1, levels);
      });
    }
    if (currentLevel === 0) {
      return Math.max.apply(this, levels);
    }
  }

  function flattenHierarchy(hierarchy) {
    var nodes = [];
    addHierarchy(hierarchy, nodes);
    return nodes;
  }

  function addHierarchy(item, nodes) {
    nodes.push(makeNode(item));
    if (!item.children || !item.children.length) {
      return;
    }
    item.children.forEach(function(child) {
      addHierarchy(child, nodes);
    });
  }

  function makeNode(item) {
    return {
      id: makeNodeId(item),
      width: nodeWidth,
      item: item
    };
  }

  function makeNodeId(item) {
    if (item.id) {
      return item.entityType + ' ' + item.id;
    } else {
      return item.entityType + ' ' + item.ids.join('-');
    }
  }

  function getConnections(nodes) {
    var connections = [];
    nodes.forEach(function(node) {
      if (node.item.children) {
        connections = connections.concat(node.item.children.map(function(child) {
          return [node.id, makeNodeId(child)];
        }));
      }
    });
    return connections;
  }

  function getMaxDepth(item, currentLevel) {
    var currentDepth = (currentLevel || 0) + 1;
    if (item.children && item.children.length) {
      return Math.max(currentDepth, Math.max.apply(this, item.children.map(function(child) {
        return getMaxDepth(child, currentDepth);
      })));
    } else {
      return currentDepth;
    }
  }

  function formatNode() {
    var item = this.point.item;

    switch (item.entityType) {
    case 'Sample':
    case 'Library':
    case 'Library Aliquot':
      var status = item.qcStatusId ? Utils.array.findUniqueOrThrow(Utils.array.idPredicate(item.qcStatusId), Constants.detailedQcStatuses)
          : null;
      return makeNodeHtml(item, status ? status.description : 'Not Ready', item.qcNote);
    case 'Pool':
      var status = QcHierarchy.poolQcOptions.find(function(x) {
        return x.value === item.qcPassed;
      });
      return makeNodeHtml(item, status.label);
    case 'Run':
      return makeNodeHtml(item, item.runStatus);
    case 'RunPartition':
      var status = item.qcStatusId ? Utils.array.findUniqueOrThrow(Utils.array.idPredicate(item.qcStatusId), Constants.partitionQcTypes)
          : null;
      return makeNodeHtml(item, status ? status.description : 'Not Set');
    case 'RunPartitionLibrary':
      var status = QcHierarchy.runLibraryQcOptions.find(function(x) {
        return x.value === item.qcPassed;
      });
      return makeNodeHtml(item, status.label, item.qcNote);
    default:
      throw new Error('Unknown entity type: ' + selectedItem.entityType);
    }
  }

  function makeNodeHtml(item, statusLabel, note) {
    var link = getEditUrl(item);
    var html = '<div><strong>' + item.typeLabel + (item.name ? ': ' + item.name : '') + '</strong>';
    if (item.qcPassed === false) {
      html += '<span class="warning-icon message-error" title="QC Failed"> ⚠</span>'
    }
    html += '</div>';
    html += '<div style="overflow: hidden;text-overflow: ellipsis;white-space: pre-wrap;" title="' + item.label + '">';
    if (link) {
      html += '<a href="' + link + '">' + item.label + '</a>';
    } else {
      html += item.label;
    }
    html += '</div>'
    html += '<div>Status: ' + statusLabel + '</div>';
    return html;
  }

  function getEditUrl(item) {
    switch (item.entityType) {
    case 'Sample':
      return Urls.ui.samples.edit(item.id);
    case 'Library':
      return Urls.ui.libraries.edit(item.id);
    case 'Library Aliquot':
      return Urls.ui.libraryAliquots.edit(item.id);
    case 'Pool':
      return Urls.ui.pools.edit(item.id);
    case 'Run':
      return Urls.ui.runs.edit(item.id);
    default:
      return null;
    }
  }

  function selectPoint(point) {
    if (selectedPoint) {
      // Have to manually deselect previous item because Point.select(x, false) doesn't seem to work properly...
      selectedPoint.select(false);
    }
    point.select(true, false);
    selectedPoint = point;
    var selectedItem = point.item;

    $(editContainer).css('margin-top', point.dataLabel.y);
    $(selectedLabel).text(selectedItem.label);
    $(selectedLabel).attr('title', selectedItem.label);
    $(typeLabel).text(selectedItem.typeLabel);
    $(statusInput).empty().off('change');
    Utils.ui.setDisabled(noteInput, true);
    $(noteInput).val(selectedItem.qcNote);
    $(noteInput).attr('data-parsley-required', false);
    $(applyButton).off('click');

    switch (selectedItem.entityType) {
    case 'Sample':
      updateDetailedQcControls(selectedItem, Urls.rest.samples.updateQcStatus(selectedItem.id));
      break;
    case 'Library':
      updateDetailedQcControls(selectedItem, Urls.rest.libraries.updateQcStatus(selectedItem.id));
      break;
    case 'Library Aliquot':
      updateDetailedQcControls(selectedItem, Urls.rest.libraryAliquots.updateQcStatus(selectedItem.id));
      break;
    case 'Pool':
      updatePoolQcControls(selectedItem);
      break;
    case 'Run':
      updateRunQcControls(selectedItem);
      break;
    case 'RunPartition':
      updatePartitionQcControls(selectedItem);
      break;
    case 'RunPartitionLibrary':
      updateRunLibraryQcControls(selectedItem);
      break;
    default:
      throw new Error('Unknown entity type: ' + selectedItem.entityType);
    }
  }

  function updateDetailedQcControls(selectedItem, updateUrl) {
    $(statusInput).append(makeSelectOption(0, 'Not Ready', !selectedItem.qcStatusId)).append(Constants.detailedQcStatuses.map(function(x) {
      return makeSelectOption(x.id, x.description, selectedItem.qcStatusId === x.id);
    })).change(function() {
      var selectedId = Number.parseInt($(this).val());
      var selected = selectedId ? Utils.array.findUniqueOrThrow(Utils.array.idPredicate(selectedId), Constants.detailedQcStatuses) : null;
      Utils.ui.setDisabled(noteInput, !selected || !selected.noteRequired);
      $(noteInput).attr('data-parsley-required', selected && selected.noteRequired);
      if (!selected || !selected.noteRequired || selectedId !== selectedItem.qcStatusId) {
        $(noteInput).val(null);
      }
    }).change();
    $(applyButton).click(function() {
      validateAndSubmit(function() {
        var update = {
          qcStatusId: Number.parseInt($(statusInput).val()) || null,
          note: $(noteInput).val() || null
        };
        Utils.ajaxWithDialog('Setting Status', 'PUT', updateUrl, update, Utils.page.pageReload);
      });
    });
  }

  function updatePoolQcControls(selectedItem) {
    $(statusInput).append(QcHierarchy.poolQcOptions.map(function(x, i) {
      return makeSelectOption(i, x.label, selectedItem.qcPassed === x.value);
    }));
    $(applyButton).click(function() {
      validateAndSubmit(function() {
        var selectedStatus = QcHierarchy.poolQcOptions[$(statusInput).val()].value;
        Utils.ajaxWithDialog('Setting Status', 'PUT', Urls.rest.pools.updateQcStatus(selectedItem.id) + '?' + $.param({
          qcPassed: selectedStatus
        }), null, Utils.page.pageReload);
      });
    });
  }

  function updateRunQcControls(selectedItem) {
    $(statusInput).append(Constants.healthTypes.map(function(x) {
      return makeSelectOption(x.label, x.label, selectedItem.runStatus === x.label);
    }));
    $(applyButton).click(function() {
      validateAndSubmit(function() {
        var selectedStatus = $(statusInput).val();
        Utils.ajaxWithDialog('Setting Status', 'PUT', Urls.rest.runs.updateStatus(selectedItem.id) + '?' + $.param({
          status: selectedStatus
        }), null, Utils.page.pageReload);
      });
    });
  }

  function updatePartitionQcControls(selectedItem) {
    $(statusInput).append(makeSelectOption(0, 'Not Set', !selectedItem.qcStatusId));
    $(statusInput).append(Constants.partitionQcTypes.map(function(x) {
      return makeSelectOption(x.id, x.description, selectedItem.qcStatusId === x.id);
    })).change(function() {
      var selectedId = Number.parseInt($(this).val());
      var selected = selectedId ? Utils.array.findUniqueOrThrow(Utils.array.idPredicate(selectedId), Constants.partitionQcTypes) : null;
      Utils.ui.setDisabled(noteInput, !selected || !selected.noteRequired);
      $(noteInput).attr('data-parsley-required', selected && selected.noteRequired);
      if (!selected || !selected.noteRequired || selectedId !== selectedItem.qcStatusId) {
        $(noteInput).val(null);
      }
    }).change();
    $(applyButton).click(
        function() {
          validateAndSubmit(function() {
            var update = {
              qcStatusId: Number.parseInt($(statusInput).val()) || null,
              note: $(noteInput).val() || null
            };
            Utils.ajaxWithDialog('Setting Status', 'PUT', Urls.rest.runs.updatePartitionQcStatus(selectedItem.ids[0], selectedItem.ids[1]),
                update, Utils.page.pageReload);
          });
        });
  }

  function updateRunLibraryQcControls(selectedItem) {
    $(statusInput).append(QcHierarchy.runLibraryQcOptions.map(function(x, i) {
      var qcPassed = selectedItem.qcPassed === undefined ? null : selectedItem.qcPassed;
      return makeSelectOption(i, x.label, qcPassed === x.value);
    }));
    Utils.ui.setDisabled(noteInput, false);
    $(applyButton).click(
        function() {
          validateAndSubmit(function() {
            var update = {
              qcPassed: QcHierarchy.runLibraryQcOptions[$(statusInput).val()].value,
              note: $(noteInput).val() || null
            };
            Utils.ajaxWithDialog('Setting Status', 'PUT', Urls.rest.runs.updateLibraryQcStatus(selectedItem.ids[0], selectedItem.ids[1],
                selectedItem.ids[2]), update, Utils.page.pageReload);
          });
        });
  }

  function validateAndSubmit(submitFunction) {
    Validate.cleanFields(editForm);
    Validate.clearErrors(editForm);

    $(noteInput).attr('data-parsley-pattern', Utils.validation.sanitizeRegex);

    var valid = $(editForm).parsley().validate();
    if (valid) {
      submitFunction();
    }
  }

  function makeSelectOption(value, text, selected) {
    var option = $('<option>').val(value).text(text);
    if (selected) {
      option.attr('selected', 'selected');
    }
    return option;
  }

})(jQuery);