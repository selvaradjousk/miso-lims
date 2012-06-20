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

package uk.ac.bbsrc.tgac.miso.notification.consumer.service.strategy;

import net.sourceforge.fluxion.spi.ServiceProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.Message;
import uk.ac.bbsrc.tgac.miso.core.data.type.PlatformType;
import uk.ac.bbsrc.tgac.miso.core.exception.InterrogationException;
import uk.ac.bbsrc.tgac.miso.notification.consumer.service.mechanism.SolidNotificationMessageConsumerMechanism;
import uk.ac.bbsrc.tgac.miso.core.service.integration.strategy.NotificationConsumerStrategy;

import java.util.List;
import java.util.Map;

/**
 * uk.ac.bbsrc.tgac.miso.core.service.integration.strategy.impl
 * <p/>
 * Implementation of a MISO notification system message consumer
 *
 * @author Rob Davey
 * @date 03/02/12
 * @since 0.1.5
 */
@ServiceProvider
public class SolidNotificationConsumerStrategy implements NotificationConsumerStrategy {
  protected static final Logger log = LoggerFactory.getLogger(SolidNotificationConsumerStrategy.class);

  public String getName() {
    return "SolidNotificationConsumer";
  }

  @Override
  public void consume(Message<Map<String, List<String>>> m) throws InterrogationException {
    new SolidNotificationMessageConsumerMechanism().consume(m);
  }

  @Override
  public boolean isStrategyFor(PlatformType pt) {
    return (pt.equals(PlatformType.SOLID));
  }
}
