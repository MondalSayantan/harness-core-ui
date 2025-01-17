/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { Scope } from '@common/interfaces/SecretsInterface'
import { RBACError } from '@rbac/utils/useRBACError/useRBACError'

export interface AddWebhookModalData {
  name: string
  identifier: string
  connectorRef: string
  repo: string
  folderPaths: { id: string; value: string }[]
}

export interface NewWebhookModalProps {
  isEdit: boolean
  initialData: AddWebhookModalData
  entityScope?: Scope
  closeModal: () => void
}
export function processFolderPaths(folderPaths: string[]): { id: string; value: string }[] {
  return folderPaths.map(path => ({ id: uuid('', nameSpace()), value: path }))
}

export const initialWebhookModalData = {
  name: '',
  identifier: '',
  connectorRef: '',
  repo: '',
  folderPaths: processFolderPaths([''])
}

export enum STATUS {
  'loading',
  'error',
  'ok'
}

export interface Error {
  message: RBACError
}
