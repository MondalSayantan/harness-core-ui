import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import ServiceVersions from '../views/ServiceVersions'

global.fetch = jest.fn().mockImplementation(url => {
  const versionObj: any = {}

  if (url.includes('authz/api/version')) {
    versionObj.version = '1.0.0'
  } else if (url.includes('ccm/api/version')) {
    versionObj.versionInfo = '2.0.0'
  } else {
    versionObj.verionInfo = {}
    versionObj.verionInfo.version = '3.0.0'
  }
  return new Promise(resolve => {
    resolve({
      ok: true,
      status: 200,
      json: () => {
        return versionObj
      }
    })
  })
})

describe('Service versions', () => {
  test('test when accordion is collapse', () => {
    const { container } = render(
      <TestWrapper>
        <ServiceVersions />
      </TestWrapper>
    )

    expect(container.querySelector('[class*="Accordion--collapse"]')).toBeDefined()
  })

  test('open accordion', async () => {
    const { container, queryByText } = render(
      <TestWrapper>
        <ServiceVersions />
      </TestWrapper>
    )

    const chevron = container.querySelector('[class*="Accordion--chevron"]')
    fireEvent.click(chevron!)
    await waitFor(() => expect(queryByText('Access Control')))
    expect(container).toMatchSnapshot()
  })
})