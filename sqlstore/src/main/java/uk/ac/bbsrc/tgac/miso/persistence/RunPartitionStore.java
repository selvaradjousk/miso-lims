package uk.ac.bbsrc.tgac.miso.persistence;

import java.io.IOException;
import java.util.List;

import uk.ac.bbsrc.tgac.miso.core.data.Partition;
import uk.ac.bbsrc.tgac.miso.core.data.Run;
import uk.ac.bbsrc.tgac.miso.core.data.RunPartition;
import uk.ac.bbsrc.tgac.miso.core.data.SequencerPartitionContainer;
import uk.ac.bbsrc.tgac.miso.core.data.impl.LibraryAliquot;

public interface RunPartitionStore {

  public RunPartition get(Run run, Partition partition) throws IOException;

  public List<RunPartition> listByAliquot(LibraryAliquot aliquot) throws IOException;

  public void create(RunPartition runPartition) throws IOException;

  public void update(RunPartition runPartition) throws IOException;

  public void deleteForRun(Run run) throws IOException;

  public void deleteForRunContainer(Run run, SequencerPartitionContainer container) throws IOException;

}
