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

package uk.ac.bbsrc.tgac.miso.core.data.impl.illumina;

import com.eaglegenomics.simlims.core.SecurityProfile;
import com.eaglegenomics.simlims.core.User;
import uk.ac.bbsrc.tgac.miso.core.data.AbstractPool;
import uk.ac.bbsrc.tgac.miso.core.data.impl.LibraryDilution;
import uk.ac.bbsrc.tgac.miso.core.data.impl.PoolImpl;
import uk.ac.bbsrc.tgac.miso.core.data.type.PlatformType;

/**
 * uk.ac.bbsrc.tgac.miso.core.data.impl.illumina
 * <p/>
 * Info
 *
 * @author Rob Davey
 * @since 0.0.2
 */
public class IlluminaPool extends PoolImpl<LibraryDilution> {
  public static final String PREFIX = "IPO";
  private final String units = "nM";

  public IlluminaPool() {
    setSecurityProfile(new SecurityProfile());
    setPlatformType(PlatformType.ILLUMINA);
  }

  public IlluminaPool(User user) {
    setSecurityProfile(new SecurityProfile(user));
    setPlatformType(PlatformType.ILLUMINA);
  }
}
