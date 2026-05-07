class StorageDB {
  constructor(tableName) {
    this.tableName = tableName
    this.prefix = `zy_${tableName}_`
  }

  _getKey(id) {
    return `${this.prefix}${id}`
  }

  _getAllKeys() {
    const keys = []
    for (let i = 0; i < uni.getStorageSync('zy_index_count') || 0; i++) {
      const key = uni.getStorageSync(`${this.prefix}index_${i}`)
      if (key) keys.push(key)
    }
    return keys
  }

  _getNextIndex() {
    let index = uni.getStorageSync(`${this.tableName}_next_index`) || 0
    uni.setStorageSync(`${this.tableName}_next_index`, index + 1)
    return index
  }

  async add(data) {
    try {
      const id = this._getNextIndex()
      const record = { ...data, id }
      uni.setStorageSync(this._getKey(id), record)
      uni.setStorageSync(`${this.prefix}index_${id}`, this._getKey(id))
      return id
    } catch (e) {
      console.error(`[${this.tableName}] add error:`, e)
      throw e
    }
  }

  async bulkAdd(dataArray) {
    try {
      const ids = []
      for (const data of dataArray) {
        const id = await this.add(data)
        ids.push(id)
      }
      return ids
    } catch (e) {
      console.error(`[${this.tableName}] bulkAdd error:`, e)
      throw e
    }
  }

  async find(query = {}) {
    try {
      const keys = this._getAllKeys()
      for (const key of keys) {
        const record = uni.getStorageSync(key)
        if (record) {
          let match = true
          for (const [k, v] of Object.entries(query)) {
            if (record[k] !== v) {
              match = false
              break
            }
          }
          if (match) return record
        }
      }
      return null
    } catch (e) {
      console.error(`[${this.tableName}] find error:`, e)
      return null
    }
  }

  async findAll(query = {}) {
    try {
      const results = []
      const keys = this._getAllKeys()
      for (const key of keys) {
        const record = uni.getStorageSync(key)
        if (record) {
          let match = true
          for (const [k, v] of Object.entries(query)) {
            if (record[k] !== v) {
              match = false
              break
            }
          }
          if (match) results.push(record)
        }
      }
      return results
    } catch (e) {
      console.error(`[${this.tableName}] findAll error:`, e)
      return []
    }
  }

  async all() {
    try {
      const results = []
      const keys = this._getAllKeys()
      for (const key of keys) {
        const record = uni.getStorageSync(key)
        if (record) results.push(record)
      }
      return results
    } catch (e) {
      console.error(`[${this.tableName}] all error:`, e)
      return []
    }
  }

  async update(id, data) {
    try {
      const key = this._getKey(id)
      const oldData = uni.getStorageSync(key)
      if (oldData) {
        uni.setStorageSync(key, { ...oldData, ...data })
        return true
      }
      return false
    } catch (e) {
      console.error(`[${this.tableName}] update error:`, e)
      throw e
    }
  }

  async remove(id) {
    try {
      const key = this._getKey(id)
      uni.removeStorageSync(key)
      uni.removeStorageSync(`${this.prefix}index_${id}`)
      return true
    } catch (e) {
      console.error(`[${this.tableName}] remove error:`, e)
      throw e
    }
  }

  async clear() {
    try {
      const keys = this._getAllKeys()
      for (const key of keys) {
        uni.removeStorageSync(key)
      }
      const count = uni.getStorageSync('zy_index_count') || 0
      for (let i = 0; i < count; i++) {
        uni.removeStorageSync(`${this.prefix}index_${i}`)
      }
      uni.setStorageSync('zy_index_count', 0)
      return true
    } catch (e) {
      console.error(`[${this.tableName}] clear error:`, e)
      throw e
    }
  }

  async bulkAddIfNotExist(dataArray, uniqueKey) {
    try {
      for (const data of dataArray) {
        const existing = await this.find({ [uniqueKey]: data[uniqueKey] })
        if (!existing) {
          await this.add(data)
        }
      }
    } catch (e) {
      console.error(`[${this.tableName}] bulkAddIfNotExist error:`, e)
    }
  }
}

export default StorageDB
