import React from 'react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'
import { render } from '@testing-library/react'
import { FetchBudgetDocument } from 'services/ce/services'
import { TestWrapper } from '@common/utils/testUtils'
import Budgets from '../Budgets'

import ResponseData from './BudgetList.json'

jest.mock('services/ce', () => ({
  useDeleteBudget: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetPerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  }))
}))

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test cases for Budgets List Page', () => {
  test('should be able to render the budget list page', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchBudgetDocument) {
          return fromValue(ResponseData)
        }
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <Budgets />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
