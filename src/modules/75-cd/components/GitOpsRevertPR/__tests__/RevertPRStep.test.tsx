/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'

import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { GitOpsRevertPR } from '../GitOpsRevertPR'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

describe('Test Revert PR Step', () => {
  beforeEach(() => {
    factory.registerStep(new GitOpsRevertPR())
  })
  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.RevertPR} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as edit step', async () => {
    const { container, getByText } = render(
      <TestStepWidget
        initialValues={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE
        }}
        type={StepType.RevertPR}
        stepViewType={StepViewType.Edit}
      />
    )

    await fireEvent.click(getByText('common.optionalConfig'))
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as edit step with runtime inputs', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE
        }}
        type={StepType.RevertPR}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render edit view as inputset step', () => {
    const { container } = render(
      <TestStepWidget
        template={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            commitId: RUNTIME_INPUT_VALUE
          }
        }}
        initialValues={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE
        }}
        type={StepType.RevertPR}
        stepViewType={StepViewType.InputSet}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m'
        }}
        template={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m'
        }}
        allValues={{
          type: StepType.RevertPR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m'
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.revertPR.name',
                localName: 'step.revertPR.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.revertPR.timeout',
                localName: 'step.revertPR.timeout'
              }
            }
          },
          variablesData: {
            type: StepType.RevertPR,
            name: 'step-name',
            identifier: 'Test_A',
            timeout: 'step-timeout'
          }
        }}
        type={StepType.RevertPR}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })
})
