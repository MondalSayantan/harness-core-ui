/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'

export const bambooMock: ConnectorInfoDTO = {
  name: 'Bamboo-Connector',
  description: '',
  projectIdentifier: 'ConnectorProject',
  identifier: 'BambooConnector',
  orgIdentifier: 'default',
  tags: {},
  type: 'Bamboo',
  spec: {
    delegateSelectors: [],
    bambooUrl: 'https://bamboo.dev.harness.io',
    auth: {
      type: 'UsernamePassword',
      spec: {
        username: 'harnessadmin',
        passwordRef: 'BambooQA'
      }
    }
  }
}

export const mockResponse: ResponseBoolean = {
  status: 'SUCCESS',
  data: true,
  metaData: {},
  correlationId: ''
}

export const mockSecret = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'b13',
      identifier: 'b13',
      tags: {},
      description: '',
      spec: { secretManagerIdentifier: 'harnessSecretManager', valueType: 'Inline', value: null }
    },
    createdAt: 1604742762283,
    updatedAt: 1604742762283,
    draft: false
  },
  metaData: null,
  correlationId: '435ce32f-4c80-4822-b01a-086186780958'
}
