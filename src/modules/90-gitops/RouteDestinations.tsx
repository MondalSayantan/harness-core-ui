/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import CDSideNav from '@cd/components/CDSideNav/CDSideNav'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { AccountSideNavProps } from '@common/RouteDestinations'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import {
  DeployEnvironmentWidget,
  NewEditEnvironmentModal
} from '@cd/components/PipelineSteps/DeployEnvStep/DeployEnvStep'

import type { GitOpsCustomMicroFrontendProps } from '@cd/interfaces/GitOps.types'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import DeployServiceWidget from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceWidget'
import ServiceEntityEditModal from '@cd/components/Services/ServiceEntityEditModal/ServiceEntityEditModal'
import AddEditEnvironmentModal from '@cd/components/PipelineSteps/DeployEnvironmentEntityStep/AddEditEnvironmentModal'
import { MultiTypeServiceField } from '@pipeline/components/FormMultiTypeServiceFeild/FormMultiTypeServiceFeild'
import { MultiTypeEnvironmentField } from '@pipeline/components/FormMultiTypeEnvironmentField/FormMultiTypeEnvironmentField'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'

// eslint-disable-next-line import/no-unresolved
const GitOpsServersList = React.lazy(() => import('gitopsui/MicroFrontendApp'))

const CDSideNavProps: SidebarContext = {
  navComponent: CDSideNav,
  subtitle: 'Continuous',
  title: 'Delivery',
  icon: 'cd-main'
}

const pipelineModuleParams: ModulePathParams = {
  module: ':module(cd)'
}

export const GitOpsPage = (): React.ReactElement | null => {
  return (
    <ChildAppMounter<GitOpsCustomMicroFrontendProps>
      getLinkForAccountResources={getLinkForAccountResources}
      ChildApp={GitOpsServersList}
      customComponents={{
        DeployEnvironmentWidget,
        DeployServiceWidget,
        NewEditEnvironmentModal,
        NewEditServiceModal,
        MultiTypeServiceField,
        MultiTypeEnvironmentField,
        ServiceEntityEditModal,
        AddEditEnvironmentModal
      }}
    />
  )
}

export default (
  <>
    <RouteWithLayout
      sidebarProps={CDSideNavProps}
      path={[routes.toGitOps({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[
        routes.toGitOpsResources({ ...accountPathProps, entity: 'agents' }),
        routes.toGitOpsResources({ ...accountPathProps, entity: 'repositories' }),
        routes.toGitOpsResources({ ...accountPathProps, entity: 'repoCertificates' }),
        routes.toGitOpsResources({ ...accountPathProps, entity: 'clusters' }),
        routes.toGitOpsResources({ ...accountPathProps, entity: 'gnuPGKeys' })
      ]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[
        routes.toGitOpsResources({ ...orgPathProps, entity: 'agents' }),
        routes.toGitOpsResources({ ...orgPathProps, entity: 'repositories' }),
        routes.toGitOpsResources({ ...orgPathProps, entity: 'repoCertificates' }),
        routes.toGitOpsResources({ ...orgPathProps, entity: 'clusters' }),
        routes.toGitOpsResources({ ...orgPathProps, entity: 'gnuPGKeys' })
      ]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>
  </>
)
