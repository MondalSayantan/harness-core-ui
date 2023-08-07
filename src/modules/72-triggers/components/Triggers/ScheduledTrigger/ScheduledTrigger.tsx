/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import TriggerOverviewPanel from '@triggers/components/steps/TriggerOverviewPanel/TriggerOverviewPanel'
import PipelineInputPanel from '@triggers/components/steps/PipelineInputPanel/PipelineInputPanel'
import WebhookPipelineInputPanelV1 from '@triggers/pages/triggers/views/V1/WebhookPipelineInputPanelV1'
import SchedulePanel from '@common/components/SchedulePanel/SchedulePanel'
import { Trigger, TriggerProps } from '../Trigger'
import type { TriggerBaseType } from '../TriggerInterface'
import ScheduledTriggerWizard from './ScheduledTriggerWizard'

export abstract class ScheduledTrigger<T> extends Trigger<T> {
  protected baseType: TriggerBaseType = 'Scheduled'

  renderStepOne(): JSX.Element {
    return <TriggerOverviewPanel />
  }

  renderStepTwo(): JSX.Element {
    return <SchedulePanel isQuartsExpressionSupported hideSeconds />
  }

  renderStepThree(isSimplifiedYAML?: boolean): JSX.Element {
    return isSimplifiedYAML ? <WebhookPipelineInputPanelV1 /> : <PipelineInputPanel />
  }

  renderTrigger(props: TriggerProps<T>): JSX.Element {
    return (
      <ScheduledTriggerWizard {...props}>
        {this.renderStepOne()}
        {this.renderStepTwo()}
        {this.renderStepThree(props.isSimplifiedYAML)}
      </ScheduledTriggerWizard>
    )
  }
}
