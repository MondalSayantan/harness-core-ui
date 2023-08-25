/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { entries as _entries, map as _map } from 'lodash-es'
import { Text, Container, Layout } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { UseStringsReturn, useStrings } from 'framework/strings'
import {
  ChangeSourceTypes,
  CustomChangeSourceList
} from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { EXECUTED_BY, UPDATED_BY } from '@cv/constants'
import { getDetailsLabel } from '@cv/utils/CommonUtils'
import { getOnClickOptions, getSourceLabel, statusToColorMapping } from './ChangeDetails.utils'
import type { ChangeDetailsDataInterface } from '../../ChangeEventCard.types'
import StatusChip from './components/StatusChip/StatusChip'
import { ExternalLinkToEntity } from './ChangeDetails.constant'
import { DeploymentImpactAnalysis } from '../EventCards/SRMStepAnalysis/SRMStepAnalysis.constants'
import css from './ChangeDetails.module.scss'

export default function ChangeDetails({
  ChangeDetailsData
}: {
  ChangeDetailsData: ChangeDetailsDataInterface
}): JSX.Element {
  const { getString } = useStrings()
  const { type, status, executedBy, deploymentImpactAnalysis } = ChangeDetailsData
  let { details } = ChangeDetailsData
  const { color, backgroundColor } = statusToColorMapping(status, type) || {}
  const isDeploymentType = [ChangeSourceTypes.HarnessCDNextGen, ChangeSourceTypes.DeploymentImpactAnalysis].includes(
    type as ChangeSourceTypes
  )
  if (
    [
      ChangeSourceTypes.HarnessCDNextGen,
      ChangeSourceTypes.K8sCluster,
      ChangeSourceTypes.DeploymentImpactAnalysis
    ].includes(type as ChangeSourceTypes)
  ) {
    details = {
      source: type as string,
      ...details,
      executedBy: (executedBy as any) || null
    }
  } else if ([ChangeSourceTypes.HarnessFF, ChangeSourceTypes.HarnessCE].includes(type as ChangeSourceTypes)) {
    details = { source: getSourceLabel(getString, type), ...details, updatedBy: (executedBy as any) || null }
  } else if (CustomChangeSourceList.includes(type as ChangeSourceTypes)) {
    details = { source: getSourceLabel(getString, type), ...details, updatedBy: (executedBy as any) || null }
  }

  if (type === ChangeSourceTypes.DeploymentImpactAnalysis) {
    details = {
      ...details,
      deploymentImpactAnalysis: deploymentImpactAnalysis
    } as unknown as ChangeDetailsDataInterface['details']
  }

  return (
    <Container>
      <Text font={{ size: 'normal', weight: 'bold' }} color={Color.GREY_800}>
        {getString('details')}
      </Text>
      <div className={css.gridContainer}>{getChanges(details)}</div>
      {status && !isDeploymentType ? (
        <StatusChip status={status} color={color} backgroundColor={backgroundColor} />
      ) : null}
    </Container>
  )
}

export const getAnalysisStep = ({
  getString,
  component
}: {
  getString: UseStringsReturn['getString']
  component: JSX.Element
}): JSX.Element => {
  return (
    <div className={css.gridContainer}>
      <Text className={css.gridItem} font={{ size: 'small', weight: 'semi-bold' }}>
        {getString('cv.analyzeDeploymentImpact.cdCard.impactAnalysisStep')}
      </Text>
      <Layout.Vertical>{component}</Layout.Vertical>
    </div>
  )
}

export const getChanges = (details: ChangeDetailsDataInterface['details']) => {
  return _map(_entries(details), item => {
    const isExecutedBy = item[0] === EXECUTED_BY
    const isUpdatedBy = item[0] === UPDATED_BY
    const isDeploymentImpactAnalysis = item[0] === DeploymentImpactAnalysis
    const { getString } = useStrings()
    let value: any = null
    let shouldVisible = true

    if (isExecutedBy || isUpdatedBy || isDeploymentImpactAnalysis) {
      shouldVisible = (item[1] as any).shouldVisible ?? true
      value = (item[1] as any).component
    } else if (Array.isArray(item[1])) {
      value = item[1]
    } else {
      value = typeof item[1] === 'string' ? item[1] : item[1]?.name
    }

    const isURL = item[0] === ExternalLinkToEntity

    if (isURL) {
      return (
        <>
          <Text className={css.gridItem} font={{ size: 'small' }}>
            {shouldVisible ? getDetailsLabel(item[0], getString) : ''}
          </Text>
          <Text
            lineClamp={1}
            className={css.isLink}
            title={value}
            font={{ size: 'small' }}
            onClick={() => {
              if (value) {
                window.open(value || '', '_blank', 'noreferrer')
              }
            }}
          >
            {value}
          </Text>
        </>
      )
    }

    return value ? (
      <>
        <Text className={css.gridItem} font={{ size: 'small', weight: 'semi-bold' }}>
          {shouldVisible ? getDetailsLabel(item[0], getString) : ''}
        </Text>
        {isExecutedBy ? (
          <Text font={{ size: 'small' }} color={Color.BLACK_100}>
            {value}
          </Text>
        ) : Array.isArray(item[1]) ? (
          <Layout.Vertical width="100%">
            {value.map((action: string, idx: number) => (
              <Layout.Horizontal key={idx} spacing="small">
                <Text key={idx} font={{ size: 'small' }} color={Color.BLACK_100}>
                  {action}
                </Text>
              </Layout.Horizontal>
            ))}
          </Layout.Vertical>
        ) : (
          <Text
            className={cx(typeof item[1] !== 'string' && item[1]?.url && css.isLink)}
            font={{ size: 'small', weight: 'semi-bold' }}
            color={Color.BLACK_100}
            {...getOnClickOptions(item[1])}
          >
            {value}
          </Text>
        )}
      </>
    ) : null
  })
}
