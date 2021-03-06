import mitt from 'mitt'
import { getMapDefault } from '../utils/helpers'
import * as transform from './transform'
import * as functional from './functional'
import * as datasource from './datasource'
import * as provider from './provider'

const registries = {
  provider,
  datasource,
  transform,
  functional
}

const getFeature = (map, type) => {
  return getMapDefault(map, type, new Map())
}

const registerFactory = map => {
  return type =>
    (registries[type].register || new Function())(getFeature(map, type))
}

const mergeFactory = map => {
  return (type, stored) =>
    (registries[type].merge || new Function())(
      getFeature(map, type),
      getFeature(stored, type)
    )
}

const resolveFactory = map => {
  return type =>
    (registries[type].resolve || new Function())(getFeature(map, type))
}

export const createRegistry = stored => {
  const map = new Map()
  const emitter = mitt()
  const register = registerFactory(map)

  if (stored) {
    const merge = mergeFactory(map)

    merge('transform', stored)
    merge('functional', stored)
    merge('datasource', stored)
    merge('provider', stored)
  }

  const resolve = resolveFactory(map)

  const instance = {
    map,
    builder: {
      transform: register('transform'),
      functional: register('functional'),
      datasource: register('datasource'),
      provider: register('provider')
    },
    use: builder => {
      typeof builder !== 'function' || builder(instance.builder)
      return instance
    },
    build: () => {
      return {
        emitter,
        destory: () => {
          if (emitter) {
            emitter.all.clear()
          }
        },
        transform: resolve('transform').useOptions({ emitter }),
        functional: resolve('functional'),
        datasource: resolve('datasource'),
        provider: resolve('provider')
      }
    }
  }

  return instance
}
