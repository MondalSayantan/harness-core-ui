/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { Meta, Story } from '@storybook/react'
import { Card, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  factory,
  TestStepWidget,
  TestStepWidgetProps
} from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { BanditStep as BanditStepComponent } from './BanditStep'

factory.registerStep(new BanditStepComponent())

export default {
  title: 'Pipelines / Pipeline Steps / BanditStep',
  // eslint-disable-next-line react/display-name
  component: TestStepWidget,
  argTypes: {
    type: { control: { disable: true } },
    stepViewType: {
      control: {
        type: 'inline-radio',
        options: Object.keys(StepViewType)
      }
    },
    onUpdate: { control: { disable: true } },
    initialValues: {
      control: {
        type: 'object'
      }
    }
  }
} as Meta

export const BanditStep: Story<Omit<TestStepWidgetProps, 'factory'>> = args => {
  const [value, setValue] = React.useState({})
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', columnGap: '20px' }}>
      <Card>
        <TestStepWidget {...args} onUpdate={setValue} />
      </Card>
      <Card>
        <pre>{yamlStringify(value)}</pre>
      </Card>
    </div>
  )
}

BanditStep.args = {
  initialValues: {
    identifier: 'Test_A',
    name: 'Test A',
    type: StepType.Bandit,
    description: 'Description',
    timeout: '10s',
    spec: {
      privileged: false,
      settings: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      },
      // Right now we do not support Image Pull Policy but will do in the future
      // pull: 'always',
      resources: {
        limits: {
          memory: '128Mi',
          cpu: '0.2'
        }
      }
    }
  },
  type: StepType.Bandit,
  stepViewType: StepViewType.Edit,
  path: '',
  testWrapperProps: {
    path: '/account/:accountId/org/:orgIdentifier/project/:projectIdentifier',
    pathParams: { accountId: 'zEaak-FLS425IEO7OLzMUg', orgIdentifier: 'default', projectIdentifier: 'Max_Test' }
  },
  template: {
    type: StepType.Bandit,
    identifier: 'Test_A',
    description: RUNTIME_INPUT_VALUE,
    timeout: RUNTIME_INPUT_VALUE,
    spec: {
      privileged: RUNTIME_INPUT_VALUE,
      settings: RUNTIME_INPUT_VALUE,
      // Right now we do not support Image Pull Policy but will do in the future
      // pull: RUNTIME_INPUT_VALUE,
      resources: {
        limits: {
          cpu: RUNTIME_INPUT_VALUE,
          memory: RUNTIME_INPUT_VALUE
        }
      }
    }
  },
  allValues: {
    type: StepType.Bandit,
    name: 'Test A',
    identifier: 'Test_A',
    description: RUNTIME_INPUT_VALUE,
    timeout: RUNTIME_INPUT_VALUE,
    spec: {
      privileged: RUNTIME_INPUT_VALUE,
      settings: RUNTIME_INPUT_VALUE,
      // Right now we do not support Image Pull Policy but will do in the future
      // pull: RUNTIME_INPUT_VALUE,
      resources: {
        limits: {
          cpu: RUNTIME_INPUT_VALUE,
          memory: RUNTIME_INPUT_VALUE
        }
      }
    }
  },
  customStepProps: {
    stageIdentifier: 'qaStage',
    metadataMap: {
      'step-name': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.name',
          localName: 'step.bandit.name'
        }
      },
      'step-description': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.description',
          localName: 'step.bandit.description'
        }
      },
      'step-timeout': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.timeout',
          localName: 'step.bandit.timeout'
        }
      },
      'step-settings': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.spec.settings',
          localName: 'step.bandit.spec.settings'
        }
      },
      // Right now we do not support Image Pull Policy but will do in the future
      // 'step-pull': {
      //   yamlProperties: {
      //     fqn: 'pipeline.stages.qaStage.execution.steps.bandit.spec.pull',
      //     localName: 'step.bandit.spec.pull'
      //   }
      // },
      'step-limitMemory': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.spec.resources.limits.memory',
          localName: 'step.bandit.spec.resources.limits.memory'
        }
      },
      'step-limitCPU': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.bandit.spec.resources.limits.cpu',
          localName: 'step.bandit.resources.spec.limits.cpu'
        }
      }
    },
    variablesData: {
      type: StepType.Bandit,
      identifier: 'Security',
      name: 'step-name',
      description: 'step-description',
      timeout: 'step-timeout',
      spec: {
        settings: 'step-settings',
        privileged: false,
        // Right now we do not support Image Pull Policy but will do in the future
        // pull: 'step-pull',
        resources: {
          limits: {
            memory: 'step-limitMemory',
            cpu: 'step-limitCPU'
          }
        }
      }
    }
  }
}