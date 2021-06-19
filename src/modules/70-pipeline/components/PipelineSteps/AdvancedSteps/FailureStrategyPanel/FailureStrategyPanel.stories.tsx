import React from 'react'
import type { Meta, Story } from '@storybook/react'
import { Formik } from 'formik'
import yaml from 'yaml'
import { Card, H3 } from '@blueprintjs/core'

import { TestWrapper } from '@common/utils/testUtils'
import { StageType } from '@pipeline/utils/stageHelpers'
import type { StepMode as Modes } from '@pipeline/utils/stepUtils'
import FailureStrategyPanel from './FailureStrategyPanel'

export default {
  title: 'Pipelines / Pipeline Steps / Failure Strategies',
  component: FailureStrategyPanel
} as Meta

interface BasicArgs {
  data: {
    failureStrategies: any[]
  }
  mode: Modes
  stageType?: StageType
}

export const Basic: Story<BasicArgs> = args => {
  return (
    <TestWrapper>
      <Formik initialValues={args.data} onSubmit={() => void 0}>
        {formik => {
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', columnGap: '20px' }}>
              <Card>
                <H3>Failure Strategies</H3>
                <FailureStrategyPanel
                  formikProps={formik}
                  mode={args.mode}
                  stageType={args.stageType || StageType.DEPLOY}
                  isReadonly={false}
                />
              </Card>
              <Card>
                <pre data-testid="code-output">{yaml.stringify(formik.values)}</pre>
              </Card>
            </div>
          )
        }}
      </Formik>
    </TestWrapper>
  )
}

Basic.args = {
  data: {
    failureStrategies: []
  }
}
