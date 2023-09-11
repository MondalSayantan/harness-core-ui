/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'

import { Layout, Button, ButtonVariation, ButtonSize } from '@harness/uicore'
import { PopoverInteractionKind, PopoverPosition } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { NavLink, useParams } from 'react-router-dom'
import { Page } from '@common/exports'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import routes from '@common/RouteDefinitions'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import AidaDashboardContent from '@dashboards/components/AidaDashboardContent'
import AidaDrawer from '@dashboards/components/AidaDrawer'
import AidaToolTip from '@dashboards/components/AidaToolTip'
import { DashboardMode } from '@dashboards/types/DashboardTypes.types'
import { useStrings } from 'framework/strings'
import { GetStarted } from './home/GetStarted'
import { useDashboardsContext } from './DashboardsContext'
import css from './home/HomePage.module.scss'

const DashboardsHeader: React.FC = () => {
  const { getString } = useStrings()
  const { aiTileDetails, breadcrumbs, mode } = useDashboardsContext()
  const { CDB_AIDA_WIDGET } = useFeatureFlags()
  const { updateTitle } = useDocumentTitle(getString('common.dashboards'))
  const { accountId, folderId, viewId } = useParams<{ accountId: string; folderId: string; viewId: string }>()
  const [isOpen, setDrawerOpen] = useState(false)
  const [isAidaDrawerOpen, setAidaDrawerOpen] = useState(false)
  const [isAidaToolTipOpen, setAidaToolTipOpen] = useState(true)

  const title = React.useMemo(
    () => (breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1].label : getString('common.dashboards')),
    [breadcrumbs, getString]
  )

  React.useEffect(() => {
    const titleArray: string[] = [getString('common.dashboards')]

    breadcrumbs.forEach(breadcrumb => titleArray.push(breadcrumb.label))

    updateTitle(titleArray)
  }, [breadcrumbs, getString, updateTitle])

  React.useEffect(() => {
    setAidaDrawerOpen(false)
  }, [aiTileDetails])

  const getStarted = (
    <>
      <Button
        minimal
        color={Color.PRIMARY_6}
        icon="question"
        onClick={() => setDrawerOpen(true)}
        text={getString('getStarted')}
      />
      <GetStarted isOpen={isOpen} setDrawerOpen={(val: boolean) => setDrawerOpen(val)} />
    </>
  )

  const aidaButton = (
    <Button
      icon="harness-copilot"
      onClick={() => setAidaDrawerOpen(true)}
      variation={ButtonVariation.AI}
      text="Create a widget using AIDA"
      tooltip={<AidaToolTip hideToolTip={() => setAidaToolTipOpen(false)} />}
      tooltipProps={{
        isOpen: isAidaToolTipOpen,
        onClose: () => setAidaToolTipOpen(false),
        popoverClassName: css.tooltip,
        position: PopoverPosition.RIGHT_TOP,
        interactionKind: PopoverInteractionKind.CLICK,
        hasBackdrop: true
      }}
      size={ButtonSize.SMALL}
    />
  )

  const showAidaButton = mode == DashboardMode.EDIT && viewId && CDB_AIDA_WIDGET && !isAidaDrawerOpen
  return (
    <Page.Header
      title={title}
      breadcrumbs={<NGBreadcrumbs links={breadcrumbs} />}
      content={
        <Layout.Horizontal spacing="medium">
          <NavLink
            className={css.tags}
            activeClassName={css.activeTag}
            to={routes.toCustomDashboardHome({ accountId, folderId })}
          >
            {getString('common.dashboards')}
          </NavLink>
          <NavLink className={css.tags} activeClassName={css.activeTag} to={routes.toCustomFolderHome({ accountId })}>
            {getString('dashboards.homePage.folders')}
          </NavLink>
          <AidaDrawer isOpen={isAidaDrawerOpen} setIsOpen={setAidaDrawerOpen}>
            <AidaDashboardContent />
          </AidaDrawer>
        </Layout.Horizontal>
      }
      toolbar={showAidaButton ? aidaButton : getStarted}
    />
  )
}

export default DashboardsHeader
