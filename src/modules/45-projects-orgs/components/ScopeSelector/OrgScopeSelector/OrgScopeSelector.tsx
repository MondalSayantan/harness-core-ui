/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layout,
  Container,
  Pagination,
  ExpandingSearchInput,
  NoDataCard,
  ListHeader,
  sortByCreated,
  sortByLastModified,
  sortByName,
  SortMethod,
  PageSpinner
} from '@harness/uicore'

import { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { Organization, useGetOrganizationAggregateDTOList } from 'services/cd-ng'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import { OrganizationCard } from './OrgCard'

import css from './OrgScopeSelector.module.scss'

interface OrgScopeSelectorProps {
  onClose?: () => void
  onClick?: (org: Organization) => void
}

export const OrgScopeSelector = (props: OrgScopeSelectorProps): JSX.Element => {
  const { onClick } = props
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { preference: sortPreference = SortMethod.LastModifiedDesc, setPreference: setSortPreference } =
    usePreferenceStore<SortMethod>(PreferenceScope.USER, `sort-orgscopelisting`)

  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState<string>()
  const { loading, data } = useGetOrganizationAggregateDTOList({
    queryParams: {
      accountIdentifier: accountId,
      searchTerm,
      pageIndex: page,
      pageSize: 30,
      sortOrders: [sortPreference]
    },
    queryParamStringifyOptions: { arrayFormat: 'repeat' },
    debounce: 300
  })
  return (
    <Container>
      <Layout.Horizontal flex={{ alignItems: 'center' }}>
        <ExpandingSearchInput
          defaultValue={searchTerm}
          placeholder={getString('projectsOrgs.searchPlaceHolder')}
          alwaysExpanded
          autoFocus={true}
          className={css.orgSearch}
          onChange={text => {
            setSearchTerm(text.trim())
            setPage(0)
          }}
        />
      </Layout.Horizontal>
      {loading && <PageSpinner />}
      <ListHeader
        selectedSortMethod={sortPreference}
        sortOptions={[...sortByLastModified, ...sortByCreated, ...sortByName]}
        onSortMethodChange={option => {
          setSortPreference(option.value as SortMethod)
        }}
        totalCount={data?.data?.totalItems}
        className={css.listHeader}
      />
      {data?.data?.content?.length ? (
        <Layout.Vertical className={css.orgContainerWrapper}>
          <div className={css.orgContainer}>
            {data.data.content.map(org => (
              <OrganizationCard
                data={org}
                key={`${org.organizationResponse.organization.identifier}`}
                hideAddOption={true}
                onClick={() => {
                  onClick?.(org.organizationResponse.organization)
                }}
              />
            ))}
          </div>

          <Pagination
            className={css.pagination}
            itemCount={data?.data?.totalItems || 0}
            pageSize={data?.data?.pageSize || 10}
            pageCount={data?.data?.totalPages || 0}
            pageIndex={data?.data?.pageIndex || 0}
            gotoPage={pageNumber => setPage(pageNumber)}
            hidePageNumbers
          />
        </Layout.Vertical>
      ) : !loading ? (
        <NoDataCard icon="nav-organization" message={getString('projectsOrgs.noOrganizations')} />
      ) : null}
    </Container>
  )
}
