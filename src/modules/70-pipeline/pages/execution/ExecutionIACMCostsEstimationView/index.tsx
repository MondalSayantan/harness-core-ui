/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
/* istanbul ignore file */
import React, { lazy } from 'react'
import { Container } from '@harness/uicore'
import ChildAppMounter from 'microfrontends/ChildAppMounter'

// eslint-disable-next-line import/no-unresolved
const RemoteIACMApp = lazy(() => import('iacm/MicroFrontendApp'))

// eslint-disable-next-line react/function-component-definition
const ExecutionIACMCostsEstimationView = (): JSX.Element => (
  <Container width="100%" height="100%">
    <ChildAppMounter ChildApp={RemoteIACMApp} />
  </Container>
)

export default ExecutionIACMCostsEstimationView