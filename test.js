#!/usr/bin/env node
'use strict'

const a = require('assert')
const isRoughlyEqual = require('is-roughly-equal')
const stations = require('vbb-stations-autocomplete')
const floor = require('floordate')
const hafas = require('./index.js')



// helpers

const onError = (err) => {
	console.error(err.stack || err.message)
	process.exit(1)
}

const findStation = (name) => stations(name, 1)[0]

const validStation = (s) =>
	   s.type === 'station'
	&& 'number' === typeof s.id
	&& 'string' === typeof s.name
	&& findStation(s.name)
	&& 'number' === typeof s.latitude
	&& 'number' === typeof s.longitude

const validPoi = (p) =>
	   p.type === 'poi'
	&& 'number' === typeof p.id
	&& 'string' === typeof p.name
	&& 'number' === typeof p.latitude
	&& 'number' === typeof p.longitude

const validAddress = (p) =>
	   p.type === 'address'
	&& 'string' === typeof p.name
	&& 'number' === typeof p.latitude
	&& 'number' === typeof p.longitude

const validLocation = (l) => validStation(l) || validPoi(l) || validAddress(l)

const validLine = (l) =>
	   'string' === typeof l.line
	&& 'number' === typeof l.nr
	&& 'boolean' === typeof l.metro
	&& 'boolean' === typeof l.express
	&& 'boolean' === typeof l.night
	&& 'object' === typeof l.type

const validStop = (s) =>
	   s.arrival instanceof Date
	&& s.departure instanceof Date
	&& validStation(s.station)



// fixtures

const minute = 60 * 1000
const hour = 60 * minute
const when = new Date(+floor(new Date(), 'day') + 10 * hour)
const validWhen = isRoughlyEqual(2 * hour, +when)



// U Spichernstr. to U Amrumer Str.
hafas.routes(9042101, 9009101, {results: 3, when, passedStations: true})
.catch(onError)
.then((routes) => {
	a.ok(Array.isArray(routes))
	a.strictEqual(routes.length, 3)
	for (let route of routes) {

		a.ok(validStation(route.from))
		a.strictEqual(route.from.id, 9042101)
		a.ok(validWhen(route.start))

		a.ok(validStation(route.to))
		a.strictEqual(route.to.id, 9009101)
		a.ok(validWhen(route.end))

		a.ok(Array.isArray(route.parts))
		a.strictEqual(route.parts.length, 1)
		const part = route.parts[0]

		a.ok(validStation(part.from))
		a.strictEqual(part.from.id, 9042101)
		a.ok(validWhen(part.start))

		a.ok(validStation(part.to))
		a.strictEqual(part.to.id, 9009101)
		a.ok(validWhen(part.end))

		a.ok(validLine(part.product))
		a.ok(findStation(part.direction))

		a.ok(Array.isArray(part.passed))
		for (let stop of part.passed) a.ok(validStop(stop))
	}
}).catch(onError)



// U Spichernstr. to Torfstraße 17
hafas.routes(9042101, {
	type: 'address', name: 'Torfstraße 17',
	latitude: 52.5416823, longitude: 13.3491223
}, {results: 1, when})
.catch(onError)
.then((routes) => {
	a.ok(Array.isArray(routes))
	a.strictEqual(routes.length, 1)
	const route = routes[0]
	const part = route.parts[route.parts.length - 1]

	a.ok(validStation(part.from))
	a.ok(validWhen(part.start))

	a.ok(validAddress(part.to))
	a.strictEqual(part.to.name, 'Torfstr. 17')
	a.ok(isRoughlyEqual(.0001, part.to.latitude, 52.5416823))
	a.ok(isRoughlyEqual(.0001, part.to.longitude, 13.3491223))
	a.ok(validWhen(part.end))

}).catch(onError)



// U Spichernstr. to ATZE Musiktheater
hafas.routes(9042101, {
	type: 'poi', name: 'ATZE Musiktheater', id: 9980720,
	latitude: 52.543333, longitude: 13.351686
}, {results: 1, when})
.catch(onError)
.then((routes) => {
	a.ok(Array.isArray(routes))
	a.strictEqual(routes.length, 1)
	const route = routes[0]
	const part = route.parts[route.parts.length - 1]

	a.ok(validStation(part.from))
	a.ok(validWhen(part.start))

	a.ok(validPoi(part.to))
	a.strictEqual(part.to.name, 'ATZE Musiktheater')
	a.ok(isRoughlyEqual(.0001, part.to.latitude, 52.543333))
	a.ok(isRoughlyEqual(.0001, part.to.longitude, 13.351686))
	a.ok(validWhen(part.end))

}).catch(onError)



hafas.departures(9042101, {duration: 5, when}) // U Spichernstr.
.catch(onError)
.then((deps) => {
	a.ok(Array.isArray(deps))
	for (let dep of deps) {

		a.ok(validStation(dep.station))
		a.strictEqual(dep.station.id, 9042101)

		a.ok(validWhen(dep.when))
		a.ok(findStation(dep.direction))
		a.ok(validLine(dep.product))
	}
}).catch(onError)



hafas.nearby(52.5137344, 13.4744798, {results: 2, distance: 400}) // U Spichernstr.
.catch(onError)
.then((nearby) => {
	a.ok(Array.isArray(nearby))
	a.strictEqual(nearby.length, 2)
	for (let location of nearby) {

		a.ok(validLocation(location))
		a.ok(location.distance > 0)
		a.ok(location.distance < 400)
	}
}).catch(onError)
