/*
 * Copyright (c) 2012. The Genome Analysis Centre, Norwich, UK
 * MISO project contacts: Robert Davey, Mario Caccamo @ TGAC
 * *********************************************************************
 *
 * This file is part of MISO.
 *
 * MISO is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MISO is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MISO.  If not, see <http://www.gnu.org/licenses/>.
 *
 * *********************************************************************
 */

package uk.ac.bbsrc.tgac.miso.webapp.controller.rest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import uk.ac.bbsrc.tgac.miso.core.data.Project;
import uk.ac.bbsrc.tgac.miso.core.manager.RequestManager;

import java.io.IOException;
import java.util.Collection;

/**
 * uk.ac.bbsrc.tgac.miso.webapp.controller.rest
 * <p/>
 * Info
 *
 * @author Rob Davey
 * @date 01-Sep-2011
 * @since 0.1.0
 */
@Controller
@RequestMapping("/rest/project")
@SessionAttributes("project")
public class ProjectRestController {
  protected static final Logger log = LoggerFactory.getLogger(ProjectRestController.class);

  @Autowired
  private RequestManager requestManager;

  public void setRequestManager(RequestManager requestManager) {
    this.requestManager = requestManager;
  }

  @RequestMapping(value = "{projectId}", method = RequestMethod.GET)
  public @ResponseBody Project jsonRest(@PathVariable Long projectId) throws IOException {
    return requestManager.getProjectById(projectId);
  }

  @RequestMapping(method = RequestMethod.GET)
  public @ResponseBody
  Collection<Project> jsonRest() throws IOException {
    Collection<Project> lp = requestManager.listAllProjects();
    for (Project p : lp) {
      p.setSamples(requestManager.listAllSamplesByProjectId(p.getProjectId()));
      p.setStudies(requestManager.listAllStudiesByProjectId(p.getProjectId()));
    }
    return lp;
  }
}
