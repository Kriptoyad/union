<script lang="ts">
import {
  transferListLatestQuery,
  transferListPageGtQuery,
  transferListPageLtQuery
} from "$lib/queries/transfer-list.svelte"
import { Effect, Option } from "effect"
import { onMount } from "svelte"
import { transferList } from "$lib/stores/transfers.svelte"
import ErrorComponent from "$lib/components/model/ErrorComponent.svelte"
import Card from "$lib/components/ui/Card.svelte"
import Sections from "$lib/components/ui/Sections.svelte"
import { chains } from "$lib/stores/chains.svelte"
import TransferListPagination from "$lib/components/ui/TransferListPagination.svelte"
import { page } from "$app/state"
import { goto } from "$app/navigation"

import { settingsStore } from "$lib/stores/settings.svelte"
import TransferListItemComponent from "$lib/components/model/TransferListItemComponent.svelte"
import TransferListItemComponentSkeleton from "$lib/components/model/TransferListItemComponentSkeleton.svelte"
import Switch from "$lib/components/ui/Switch.svelte"
    import type { AppContext } from "$lib/runtime";

const initializeQuery = async () => {
  const pageParam = page.url.searchParams.get("page")
  // XXX: no mutable effects
  let effect: Effect.Effect<any, never, AppContext>

  if (pageParam) {
    if (pageParam.startsWith("-")) {
      // Greater-than query (prev page)
      const sortOrder = pageParam.substring(1)
      // @ts-ignore sorOrder is not strictly a SortOrder, but this is desired behavior
      effect = transferListPageGtQuery(sortOrder, settingsStore.pageLimit, settingsStore.mainnetOnly)
    } else {
      // Less-than query (next page)
      // @ts-ignore pageParam is not strictly a SortOrder, but this is desired behavior
      effect = transferListPageLtQuery(pageParam, settingsStore.pageLimit, settingsStore.mainnetOnly)
    }
  } else {
    // No page param, load latest
    effect = transferListLatestQuery(settingsStore.pageLimit, settingsStore.mainnetOnly)
  }

  await transferList.runEffect(effect)
}

onMount(() => {
  initializeQuery()

  return () => {
    transferList.interruptFiber()
  }
})

const onLive = async () => {
  if (Option.isSome(transferList.data)) {
    await transferList.runEffect(transferListLatestQuery(settingsStore.pageLimit, settingsStore.mainnetOnly))
    // Remove page param from URL
    goto("?", { replaceState: true })
  }
}

const onPrevPage = async () => {
  if (Option.isSome(transferList.data)) {
    let firstSortOrder = transferList.data.value.at(0)?.sort_order
    if (!firstSortOrder) return
    await transferList.runEffect(transferListPageGtQuery(firstSortOrder, settingsStore.pageLimit, settingsStore.mainnetOnly))
    // Update URL with the new page param, prefixed with '-' for greater-than queries
    goto(`?page=-${firstSortOrder}`, { replaceState: true })
  }
}

const onNextPage = async () => {
  if (Option.isSome(transferList.data)) {
    let lastSortOrder = transferList.data.value.at(-1)?.sort_order
    if (!lastSortOrder) return
    await transferList.runEffect(transferListPageLtQuery(lastSortOrder, settingsStore.pageLimit, settingsStore.mainnetOnly))
    // Update URL with the new page param (no prefix for less-than queries)
    goto(`?page=${lastSortOrder}`, { replaceState: true })
  }
}
</script>

<Sections>

  <Card class="overflow-auto" divided>
    {#if Option.isSome(transferList.error)}
      <ErrorComponent error={transferList.error.value}/>
    {/if}
    {#if Option.isSome(transferList.data) && Option.isSome(chains.data)}
      {#each transferList.data.value as transfer(transfer.sort_order)}
        <TransferListItemComponent {transfer} />
      {:else}
        <div class="p-4 text-center text-gray-500">No transfers found</div>
      {/each}
    {:else}
      {#if Option.isSome(transferList.error)}
        <ErrorComponent error={transferList.error.value}/>
      {/if}
      {#each Array(settingsStore.pageLimit).fill(0)}
        <TransferListItemComponentSkeleton />
      {/each}
    {/if}
  </Card>
  <div class="flex flex-col sm:flex-row sm:items-center gap-4">
    <TransferListPagination 
      data={transferList.data}
      {onLive}
      {onPrevPage}
      {onNextPage}
    />
    <div class="flex items-center gap-2">
      <Switch
        checked={settingsStore.mainnetOnly}
        label="Mainnet Only"
        change={(value) => {settingsStore.mainnetOnly = value; initializeQuery()}}
      />
    </div>
  </div>
</Sections>
