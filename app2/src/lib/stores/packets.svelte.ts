import { type AppContext, runFork, runPromise } from "$lib/runtime"
import type { FetchDecodeGraphqlError } from "$lib/utils/queries"
import type { PacketCount, PacketDetails, PacketList } from "@unionlabs/sdk/schema"
import { Effect, Fiber, Option } from "effect"
import type { TimeoutException } from "effect/Cause"

class PacketListStore {
  data = $state(Option.none<typeof PacketList.Type>())
  error = $state(Option.none<FetchDecodeGraphqlError | TimeoutException>())
  fiber = $state(Option.none<Fiber.RuntimeFiber<any, never>>())

  async runEffect<A>(effect: Effect.Effect<A, never, AppContext>) {
    this.data = Option.none()
    await this.interruptFiber()
    const fiber = runFork(effect)
    this.fiber = Option.some(fiber)
    return fiber
  }

  async clearFiber() {
    await this.interruptFiber()
    this.fiber = Option.none()
  }

  async interruptFiber() {
    if (Option.isSome(this.fiber)) {
      await runPromise(Fiber.interrupt(this.fiber.value))
      this.fiber = Option.none()
    }
  }
}

class PacketDetailsStore {
  data = $state(Option.none<PacketDetails>())
  error = $state(Option.none<FetchDecodeGraphqlError | TimeoutException>())
  fiber = $state(Option.none<Fiber.RuntimeFiber<any, never>>())

  async runEffect<A>(effect: Effect.Effect<A, never, AppContext>) {
    this.data = Option.none()
    await this.interruptFiber()
    const fiber = runFork(effect)
    this.fiber = Option.some(fiber)
    return fiber
  }

  async clearFiber() {
    await this.interruptFiber()
    this.fiber = Option.none()
  }

  async interruptFiber() {
    if (Option.isSome(this.fiber)) {
      await runPromise(Fiber.interrupt(this.fiber.value))
      this.fiber = Option.none()
    }
  }
}

class PacketCountStore {
  data = $state(Option.none<typeof PacketCount.Type>())
  error = $state(Option.none<FetchDecodeGraphqlError | TimeoutException>())
}

export const packetList = new PacketListStore()
export const packetDetails = new PacketDetailsStore()
export const packetCount = new PacketCountStore()
