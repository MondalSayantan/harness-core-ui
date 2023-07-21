/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color } from '@harness/design-system'
import { Container, Layout, Page, Tabs, Text } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { DiscoveryPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useGetAgent } from 'services/servicediscovery'
import routes from '@common/RouteDefinitions'
import NetworkMapTable from './views/network-map/NetworkMapTable'
import DiscoveryHistory from './views/discovery-history/DiscoveryHistory'
import Settings from './views/settings/Settings'
import DiscoveredResources from './views/discovered-resources/DiscoveredResources'
import css from './DiscoveryDetails.module.scss'

const DiscoveryDetails: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier, dAgentId } = useParams<DiscoveryPathProps>()
  const { getString } = useStrings()

  const { data: discoveryAgentData } = useGetAgent({
    agentIdentity: dAgentId,
    queryParams: {
      accountIdentifier: accountId,
      organizationIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier
    }
  })

  const date = discoveryAgentData?.installationDetails
    ? moment(discoveryAgentData?.installationDetails?.createdAt).format('MMM DD, YYYY hh:mm A')
    : getString('na')

  return (
    <>
      <Page.Header
        className={css.header}
        breadcrumbs={
          <NGBreadcrumbs
            links={[
              {
                url: routes.toDiscovery({ accountId, orgIdentifier, projectIdentifier, module: 'chaos' }),
                label: getString('common.discovery')
              },
              {
                url: routes.toDiscoveryDetails({
                  accountId,
                  orgIdentifier,
                  projectIdentifier,
                  dAgentId,
                  module: 'chaos'
                }),
                label: dAgentId
              }
            ]}
          />
        }
        title={
          <Container width={'100%'} flex={{ justifyContent: 'space-between' }}>
            <Layout.Vertical>
              <Layout.Horizontal spacing="small">
                <Text color={Color.BLACK} style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  {discoveryAgentData?.name}
                </Text>
                <Text
                  margin={{ left: 'small' }}
                  inline
                  icon={'full-circle'}
                  iconProps={{ size: 6, color: Color.GREEN_500 }}
                  tooltipProps={{ isDark: true, position: 'bottom' }}
                  font={{ size: 'small' }}
                >
                  {getString('connected')}
                </Text>
              </Layout.Horizontal>
              <Text color={Color.GREY_500} font={{ size: 'small' }} margin={{ right: 'small' }}>
                {getString('discovery.discoveryDetails.id')}: {discoveryAgentData?.identity}
              </Text>
            </Layout.Vertical>
          </Container>
        }
        toolbar={
          <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
            <Text font={{ size: 'small' }}>
              {getString('discovery.discoveryDetails.lastDiscovery')}: {date}
            </Text>
            {/* <Button
              margin={{ left: 'medium' }}
              icon="edit"
              rightIcon="chevron-down"
              variation={ButtonVariation.SECONDARY}
              text="Edit"
            /> */}
          </Layout.Horizontal>
        }
      />
      <Page.Body className={css.container}>
        <Layout.Horizontal className={css.tabsContainerMain} flex={{ justifyContent: 'space-between' }}>
          <Container width={'100%'}>
            <Tabs
              id={'DiscoveredServiceTab'}
              defaultSelectedTabId={'discovered services'}
              tabList={[
                {
                  id: 'discovered services',
                  title: getString('discovery.discoveryDetails.tabTitles.resources'),
                  panel: <DiscoveredResources />
                },
                {
                  id: 'network maps',
                  title: getString('discovery.discoveryDetails.tabTitles.networkMaps'),
                  panel: (
                    <NetworkMapTable
                      agentName={discoveryAgentData?.name}
                      connectorID={discoveryAgentData?.k8sConnector?.id}
                    />
                  )
                },
                {
                  id: 'discovery history',
                  title: getString('discovery.discoveryDetails.tabTitles.history'),
                  panel: <DiscoveryHistory />
                },
                {
                  id: 'settings',
                  title: getString('settingsLabel'),
                  panel: <Settings />
                }
              ]}
            />
          </Container>
        </Layout.Horizontal>
      </Page.Body>
    </>
  )
}

export default DiscoveryDetails
