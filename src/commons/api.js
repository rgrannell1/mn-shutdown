

const fs = require('fs').promises
const constants = require('../commons/constants')
const clic = require('cloud-init-compile')

const api = {}

api.listImages = async client => {
  const res = await client({
    path: '/images?type=distribution'
  })

  if (!res.ok) {
    throw res
  }

  const { images } = await res.json()

  return images.filter(data => {
    return data.distribution === 'Ubuntu'
  })
}

api.getImage = async (slug, client) => {
  const images = await api.listImages(client)

  return images.find(data => {
    return data.slug === slug
  })
}

api.listDroplets = async client => {
  const res = await client({
    path: '/droplets'
  })

  if (!res.ok) {
    throw res
  }

  const { droplets } = await res.json()
  return droplets
}

api.getDroplet = async (name, client) => {
  const droplets = await api.listDroplets(client)

  return droplets.find(droplet => {
    return droplet.name === constants.vms.name
  })
}

api.snapshot = async (id, snapshotName, client) => {
  const res = await client({
    path: `/droplets/${id}/actions`,
    body: {
      type: 'snapshot',
      name: snapshotName
    }
  })

  if (!res.ok) {
    throw res
  }

  const { action } = await res.json()
  return action
}

api.listSnapshots = async (client) => {
  const res = await client({
    path: `/snapshots?resource_type=droplet`
  })

  if (!res.ok) {
    throw res
  }

  const { snapshots } = await res.json()
  return snapshots
}

api.listSSHKeys = async client => {
  const res = await client({
    path: '/account/keys'
  })

  if (!res.ok) {
    throw res
  }

  const { ssh_keys } = await res.json()
  return ssh_keys
}

api.getSSHKey = async (name, client) => {
  const keys = await api.listSSHKeys(client)

  return keys.find(data => {
    return data.name === name
  })
}

api.createDroplet = async (image, key, client) => {
  const content = await clic.api({
    workingDirectory: '/',
    gzip: false,
    fpaths: [
      'src/user-data/main.sh'
    ],
    toRun: '/main.sh'
  })

  const body = {
    ...constants.vmConfig,
    image: image.id,
    ssh_keys: [key.id],
    user_data: content
  }

  const res = await client({
    method: 'POST',
    path: '/droplets',
    body
  })

  if (!res.ok) {
    throw res
  }

  const { droplet } = await res.json()
  return droplet
}

api.updateSnapshot = async () => { }

api.shutdownDroplet = async () => { }

api.listFloatingIps = async client => {
  const res = await client({
    path: '/floating_ips'
  })

  if (!res.ok) {
    throw res
  }

  const { floating_ips } = await res.json()
  return floating_ips
}

api.assignFloatingIp = async (floatingIp, droplet, client) => {
  const ip = floatingIp.ip
  const body = {
    type: 'assign',
    droplet_id: droplet.id,
  }

  const res = await client({
    method: 'POST',
    path: `/floating_ips/${ip}/actions`,
    body
  })

  if (!res.ok) {
    throw res
  }

  const { action } = await res.json()
  return action
}

api.reserveFloatingIp = async (droplet, client) => {
  const body = { }

  if (droplet) {
    body.droplet_id = droplet.id
  } else {
    body.region = 'nyc'
  }

  const res = await client({
    method: 'POST',
    path: '/floating_ips',
    body
  })

  if (!res.ok) {
    throw res
  }

  const { floating_ip } = await res.json()
  return floating_ip
}

api.restoreDroplet = async (droplet, snapshot, client) => {
  if (!droplet) {
    throw new Error('droplet not provided.')
  }

  const body = {
    type: 'restore',
    image: snapshot.id
  }

  const res = await client({
    method: 'POST',
    path: `/droplets/${droplet.id}/actions`,
    body
  })

  if (!res.ok) {
    throw res
  }

  const { action } = await res.json()
  return action
}

module.exports = api
