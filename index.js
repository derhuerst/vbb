'use strict'

const createClient = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const addTransferInfoToJourney = require('./lib/add-transfer-info')

const defaults = {
	profile: vbbProfile
}

const createVbbHafas = (userAgent, opt = {}) => {
	const {profile} = {...defaults, ...opt}

	const hafas = createClient(profile, userAgent)

	const origJourneys = hafas.journeys
	const journeysWithTransfers = (from, to, opt = {}) => {
		if (opt && opt.transferInfo) opt.stopovers = true
		const p = origJourneys(from, to, opt)

		if (opt && opt.transferInfo) {
			return p.then((res) => {
				for (let journey of res.journeys) addTransferInfoToJourney(journey)
				return res
			})
		}
		return p
	}
	hafas.journeys = journeysWithTransfers

	const origRefreshJourney = hafas.refreshJourney
	const refreshJourneyWithTransfers = (ref, opt = {}) => {
		if (opt && opt.transferInfo) opt.stopovers = true
		const p = origRefreshJourney(ref, opt)

		if (opt && opt.transferInfo) {
			return p.then(j => {
				addTransferInfoToJourney(j)
				return j
			})
		}
		return p
	}
	hafas.refreshJourney = refreshJourneyWithTransfers

	return hafas
}

createVbbHafas.defaults = defaults
module.exports = createVbbHafas
