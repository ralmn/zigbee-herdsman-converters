const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const globalStore = require('zigbee-herdsman-converters/lib/store');
const { repInterval } = require('zigbee-herdsman-converters/lib/constants');

const { precisionRound, postfixWithEndpointName } = require('zigbee-herdsman-converters/lib/utils');


const e = exposes.presets;
const ea = exposes.access;


const options_measurement_poll_interval = exposes.numeric(`measurement_poll_interval`, ea.SET).withValueMin(60).withDescription(`This device does not support reporting electric measurements so it is polled instead. The default poll interval is 120 seconds. Min value is 60 seconds`);



// full list available on https://github.com/fairecasoimeme/Zlinky_TIC/blob/master/README.md
// Thanks for the translation of the descriptions to @Gael67350 (https://github.com/Gael67350) 
let dataReportable = [
    { "name": "PAPP", "unit": "VA", "clusterId": 2820, "attributId": 1295, "description": "Apparent power", "cluster": "haElectricalMeasurement", "attribut": "apparentPower", "standard": false, "reportable": true, "onetime": false },
    { "name": "IINST", "unit": "A", "clusterId": 2820, "attributId": 1288, "description": "RMS current", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrent", "standard": false, "reportable": true, "onetime": false },
    { "name": "IINST1", "unit": "A", "clusterId": 2820, "attributId": 1288, "description": "RMS current (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrent", "standard": false, "reportable": true, "onetime": false },
    { "name": "IINST2", "unit": "A", "clusterId": 2820, "attributId": 2312, "description": "RMS current (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentPhB", "standard": false, "reportable": true, "onetime": false },
    { "name": "IINST3", "unit": "A", "clusterId": 2820, "attributId": 2568, "description": "RMS current (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentPhC", "standard": false, "reportable": true, "onetime": false },
    { "name": "EAST", "unit": "Wh", "clusterId": 1794, "attributId": 0, "description": "Total active power delivered", "cluster": "seMetering", "attribut": "currentSummDelivered", "standard": true, "reportable": true, "onetime": false },
    { "name": "CCASN", "unit": "W", "clusterId": 2820, "attributId": 1291, "description": "Current point of the active load curve drawn", "cluster": "haElectricalMeasurement", "attribut": "activePower", "standard": true, "reportable": true, "onetime": false },
    { "name": "CCASN-1", "unit": "W", "clusterId": 2820, "attributId": 2315, "description": "Previous point of the active load curve drawn", "cluster": "haElectricalMeasurement", "attribut": "activePowerPhB", "standard": true, "reportable": true, "onetime": false },
    { "name": "SINSTS", "unit": "VA", "clusterId": 2820, "attributId": 1295, "description": "Immediate apparent power delivered", "cluster": "haElectricalMeasurement", "attribut": "apparentPower", "standard": true, "reportable": true, "onetime": false },
    { "name": "SINSTS1", "unit": "VA", "clusterId": 2820, "attributId": 1295, "description": "Immediate apparent power delivered (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "apparentPower", "standard": true, "reportable": true, "onetime": false },
    { "name": "SINSTS2", "unit": "VA", "clusterId": 2820, "attributId": 2319, "description": "Immediate apparent power delivered (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "apparentPowerPhB", "standard": true, "reportable": true, "onetime": false },
    { "name": "SINSTS3", "unit": "VA", "clusterId": 2820, "attributId": 2575, "description": "Immediate apparent power delivered (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "apparentPowerPhC", "standard": true, "reportable": true, "onetime": false },
    { "name": "ERQ2", "unit": "VArh", "clusterId": 2820, "attributId": 1294, "description": "Total reactive power (Q2)", "cluster": "haElectricalMeasurement", "attribut": "reactivePower", "standard": true, "reportable": true, "onetime": false },
    { "name": "ERQ3", "unit": "VArh", "clusterId": 2820, "attributId": 2318, "description": "Total reactive power (Q3)", "cluster": "haElectricalMeasurement", "attribut": "reactivePowerPhB", "standard": true, "reportable": true, "onetime": false },
    { "name": "ERQ4", "unit": "VArh", "clusterId": 2820, "attributId": 2574, "description": "Total reactive power (Q4)", "cluster": "haElectricalMeasurement", "attribut": "reactivePowerPhC", "standard": true, "reportable": true, "onetime": false },
    { "name": "IRMS1", "unit": "A", "clusterId": 2820, "attributId": 1288, "description": "RMS current (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrent", "standard": true, "reportable": true, "onetime": false },
    { "name": "IRMS2", "unit": "A", "clusterId": 2820, "attributId": 2312, "description": "RMS current (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentPhB", "standard": true, "reportable": true, "onetime": false },
    { "name": "IRMS3", "unit": "A", "clusterId": 2820, "attributId": 2568, "description": "RMS current (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentPhC", "standard": true, "reportable": true, "onetime": false },
    { "name": "URMS1", "unit": "V", "clusterId": 2820, "attributId": 1285, "description": "RMS voltage (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "rmsVoltage", "standard": true, "reportable": true, "onetime": false },
    { "name": "URMS2", "unit": "V", "clusterId": 2820, "attributId": 2309, "description": "RMS voltage (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "rmsVoltagePhB", "standard": true, "reportable": true, "onetime": false },
    { "name": "URMS3", "unit": "V", "clusterId": 2820, "attributId": 2565, "description": "RMS voltage (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "rmsVoltagePhC", "standard": true, "reportable": true, "onetime": false },
    { "name": "ERQ1", "unit": "VArh", "clusterId": 2820, "attributId": 773, "description": "Total reactive power (Q1)", "cluster": "haElectricalMeasurement", "attribut": "totalReactivePower", "standard": true, "reportable": true, "onetime": false },
    { "name": "EAIT", "unit": "Wh", "clusterId": 1794, "attributId": 1, "description": "Total active power injected", "cluster": "seMetering", "attribut": "currentSummReceived", "standard": true, "reportable": true, "onetime": false },
];

let dataNonReportable = [
    { "name": "PMAX", "unit": "W", "clusterId": 2820, "attributId": 1293, "description": "Three-phase power peak", "cluster": "haElectricalMeasurement", "attribut": "activePowerMax", "standard": false, "reportable": false, "onetime": false },
    { "name": "IMAX", "unit": "A", "clusterId": 2820, "attributId": 1290, "description": "RMS current peak", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentMax", "standard": false, "reportable": false, "onetime": false },
    { "name": "IMAX1", "unit": "A", "clusterId": 2820, "attributId": 1290, "description": "RMS current peak (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentMax", "standard": false, "reportable": false, "onetime": false },
    { "name": "IMAX2", "unit": "A", "clusterId": 2820, "attributId": 2314, "description": "RMS current peak (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentMaxPhB", "standard": false, "reportable": false, "onetime": false },
    { "name": "IMAX3", "unit": "A", "clusterId": 2820, "attributId": 2570, "description": "RMS current peak (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "rmsCurrentMaxPhC", "standard": false, "reportable": false, "onetime": false },
    { "name": "ISOUSC", "unit": "A", "clusterId": 2817, "attributId": 13, "description": "Subscribed intensity level", "cluster": "haMeterIdentification", "attribut": "availablePower", "standard": false, "reportable": false, "onetime": false },
    { "name": "VTIC", "unit": "-", "clusterId": 2817, "attributId": 10, "description": "Customer tele-information protocol version", "cluster": "haMeterIdentification", "attribut": "softwareRevision", "standard": true, "reportable": false, "onetime": true },
    { "name": "PTEC", "unit": "-", "clusterId": 1794, "attributId": 32, "description": "Current pricing period", "cluster": "seMetering", "attribut": "activeRegisterTierDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "BASE", "unit": "Wh", "clusterId": 1794, "attributId": 0, "description": "Base index", "cluster": "seMetering", "attribut": "currentSummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EASF10", "unit": "Wh", "clusterId": 1794, "attributId": 274, "description": "Total provider active power delivered (index10)", "cluster": "seMetering", "attribut": "currentTier10SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "HCHC", "unit": "Wh", "clusterId": 1794, "attributId": 256, "description": "HCHC index", "cluster": "seMetering", "attribut": "currentTier1SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EJPHN", "unit": "Wh", "clusterId": 1794, "attributId": 256, "description": "EJPHN index", "cluster": "seMetering", "attribut": "currentTier1SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "BBRHCJB", "unit": "Wh", "clusterId": 1794, "attributId": 256, "description": "BBRHCJB index", "cluster": "seMetering", "attribut": "currentTier1SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EASF01", "unit": "Wh", "clusterId": 1794, "attributId": 256, "description": "Total provider active power delivered (index 01)", "cluster": "seMetering", "attribut": "currentTier1SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "EASF02", "unit": "Wh", "clusterId": 1794, "attributId": 258, "description": "Provider active power delivered (index 02)", "cluster": "seMetering", "attribut": "currentTier2SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "BBRHCJW", "unit": "Wh", "clusterId": 1794, "attributId": 260, "description": "BBRHCJW index", "cluster": "seMetering", "attribut": "currentTier3SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EASF03", "unit": "Wh", "clusterId": 1794, "attributId": 260, "description": "Provider active power delivered (index 03)", "cluster": "seMetering", "attribut": "currentTier3SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "BBRHCJR", "unit": "Wh", "clusterId": 1794, "attributId": 264, "description": "BBRHCJR index", "cluster": "seMetering", "attribut": "currentTier5SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EASF07", "unit": "Wh", "clusterId": 1794, "attributId": 268, "description": "Provider active power delivered (index 07)", "cluster": "seMetering", "attribut": "currentTier7SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "EASF09", "unit": "Wh", "clusterId": 1794, "attributId": 272, "description": "Provider active power delivered (index 09)", "cluster": "seMetering", "attribut": "currentTier9SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "ADC0", "unit": "-", "clusterId": 1794, "attributId": 776, "description": "Serial Number", "cluster": "seMetering", "attribut": "meterSerialNumber", "standard": false, "reportable": false, "onetime": true },
    { "name": "HCHP", "unit": "Wh", "clusterId": 1794, "attributId": 258, "description": "HCHP index", "cluster": "seMetering", "attribut": "currentTier2SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EJPHPM", "unit": "Wh", "clusterId": 1794, "attributId": 258, "description": "EJPHPM index", "cluster": "seMetering", "attribut": "currentTier2SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "BBRHPJB", "unit": "Wh", "clusterId": 1794, "attributId": 258, "description": "BBRHPJB index", "cluster": "seMetering", "attribut": "currentTier2SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "BBRHPJW", "unit": "Wh", "clusterId": 1794, "attributId": 262, "description": "BBRHPJW index", "cluster": "seMetering", "attribut": "currentTier4SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "BBRHPJR", "unit": "Wh", "clusterId": 1794, "attributId": 266, "description": "BBRHPJR index", "cluster": "seMetering", "attribut": "currentTier6SummDelivered", "standard": false, "reportable": false, "onetime": false },
    { "name": "EASF04", "unit": "Wh", "clusterId": 1794, "attributId": 262, "description": "Provider active power delivered (index 04)", "cluster": "seMetering", "attribut": "currentTier4SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "EASF05", "unit": "Wh", "clusterId": 1794, "attributId": 264, "description": "Provider active power delivered (index 05)", "cluster": "seMetering", "attribut": "currentTier5SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "EASF06", "unit": "Wh", "clusterId": 1794, "attributId": 266, "description": "Provider active power delivered (index 06)", "cluster": "seMetering", "attribut": "currentTier6SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "ADSC", "unit": "-", "clusterId": 1794, "attributId": 776, "description": "Secondary meter address", "cluster": "seMetering", "attribut": "meterSerialNumber", "standard": true, "reportable": false, "onetime": true },
    { "name": "EASF08", "unit": "Wh", "clusterId": 1794, "attributId": 270, "description": "Provider active power delivered (index 08)", "cluster": "seMetering", "attribut": "currentTier8SummDelivered", "standard": true, "reportable": false, "onetime": false },
    { "name": "SMAXN", "unit": "VA", "clusterId": 2820, "attributId": 1293, "description": "Apparent power delivered peak", "cluster": "haElectricalMeasurement", "attribut": "activePowerMax", "standard": true, "reportable": false, "onetime": false },
    { "name": "SMAXN1", "unit": "VA", "clusterId": 2820, "attributId": 1293, "description": "Apparent power delivered peak (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "activePowerMax", "standard": true, "reportable": false, "onetime": false },
    { "name": "SMAXN2", "unit": "VA", "clusterId": 2820, "attributId": 2317, "description": "Apparent power delivered peak (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "activePowerMaxPhB", "standard": true, "reportable": false, "onetime": false },
    { "name": "SMAXN3", "unit": "VA", "clusterId": 2820, "attributId": 2573, "description": "Apparent power delivered peak (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "activePowerMaxPhC", "standard": true, "reportable": false, "onetime": false },
    { "name": "UMOY1", "unit": "V", "clusterId": 2820, "attributId": 1297, "description": "Average RMS voltage (phase 1)", "cluster": "haElectricalMeasurement", "attribut": "averageRmsVoltageMeasPeriod", "standard": true, "reportable": false, "onetime": false },
    { "name": "UMOY3", "unit": "V", "clusterId": 2820, "attributId": 2577, "description": "Average RMS voltage (phase 3)", "cluster": "haElectricalMeasurement", "attribut": "averageRmsVoltageMeasPeriodPhC", "standard": true, "reportable": false, "onetime": false },
    { "name": "UMOY2", "unit": "V", "clusterId": 2820, "attributId": 2321, "description": "Average RMS voltage (phase 2)", "cluster": "haElectricalMeasurement", "attribut": "averageRmsVoltageMeasurePeriodPhB", "standard": true, "reportable": false, "onetime": false },
    { "name": "PREF", "unit": "kVA", "clusterId": 2817, "attributId": 13, "description": "Apparent power of reference (PREF)", "cluster": "haMeterIdentification", "attribut": "availablePower", "standard": true, "reportable": false, "onetime": false },
    { "name": "PCOUP", "unit": "kVA", "clusterId": 2817, "attributId": 14, "description": "Apparent power threshold (PCOUP)", "cluster": "haMeterIdentification", "attribut": "powerThreshold", "standard": true, "reportable": false, "onetime": false },
    { "name": "PRM", "unit": "-", "clusterId": 1794, "attributId": 775, "description": "PRM", "cluster": "seMetering", "attribut": "siteId", "standard": true, "reportable": false, "onetime": true },
];





// All attributes avaialables
let data = [
    ...dataReportable,
    ...dataNonReportable
];

function extractAttribute(cluster, nonReportableOnly) {
    let attributes = (nonReportableOnly ? dataNonReportable : data).filter(item => item.cluster === cluster);
    return attributes
        .filter(a => a.onetime == false)
        .map(i => i.attribut)
        .filter(a => a != null)
        .filter((value, index, self) => self.indexOf(value) === index); // Unique attributs
}

// For HomeAssistant
const indexEnergy = () => exposes.numeric('energy', ea.STATE).withUnit('Wh').withDescription('Index Base').withProperty('currentSummDelivered');

// Generate all metrics from attributs list 
let exposesData = data.map(item => {
    if (item.unit != null && item.unit != '-' && item.unit != '') {
        return exposes.numeric(item.name, ea.STATE).withDescription(item.description).withProperty(item.attribut).withUnit(item.unit);
    } else {
        return exposes.text(item.name, ea.STATE).withDescription(item.description).withProperty(item.attribut);
    }

}).filter(e => e != null);


function parsingResponse(model, msg, entries) {
    let payload = {}
    for (let entry in msg.data) {
        if (msg.data[entry] != null) {
            const val = msg.data[entry]
            if (typeof (val) == "number") {
                payload[postfixWithEndpointName(entry, msg, model)] = precisionRound(val, 2)
            } else {
                payload[postfixWithEndpointName(entry, msg, model)] = val;
            }

        }
    }
    return payload;

}


const haMeterIdentificationFZ = {
    cluster: 'haMeterIdentification',
    type: ['attributeReport', 'readResponse', 'write'],
    convert: (model, msg, publish, options, meta) => {
        return parsingResponse(model, msg, extractAttribute('haMeterIdentification', false))
    }
};

const haElectricalMeasurementFZ = {
    cluster: 'haElectricalMeasurement',
    type: ['attributeReport', 'readResponse', 'write'],
    convert: (model, msg, publish, options, meta) => {
        return parsingResponse(model, msg, extractAttribute('haElectricalMeasurement', false))
    }
};

const seMeteringFZ = {
    cluster: 'seMetering',
    type: ['attributeReport', 'readResponse', 'write'],
    convert: (model, msg, publish, options, meta) => {
        let payload = parsingResponse(model, msg, extractAttribute('seMetering', false))
        // merging of off-peak and peak hour meter
        if (payload['currentSummDelivered'] == 0 && (payload['currentTier1SummDelivered'] > 0 || payload['currentTier2SummDelivered'] > 0)) {
            payload['currentSummDelivered'] = payload['currentTier1SummDelivered'] + payload['currentTier2SummDelivered'];
        }
        return payload;
    }
};

function createChunk(array, chunkSize) {
    let R = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        R.push(array.slice(i, i + chunkSize));
    }
    return R;
}


// Read attributs when are not reportable
async function poll(endpoint) {
    attrs = extractAttribute('haElectricalMeasurement', true).sort((a, b) => a.localeCompare(b));
    let chunks = createChunk(attrs, 5);
    for (let chunk of chunks)
        await endpoint.read('haElectricalMeasurement', chunk);

    attrs = extractAttribute('seMetering', true).sort((a, b) => a.localeCompare(b));
    chunks = createChunk(attrs, 5);
    for (let chunk of chunks)
        await endpoint.read('seMetering', chunk);
}


const definition = {
    zigbeeModel: ['ZLinky_TIC'],
    model: 'ZLinky_TIC',
    vendor: 'LiXee',
    description: 'Module for collecting consumption and production information from French "Linky" meters',
    fromZigbee: [haMeterIdentificationFZ, seMeteringFZ, haElectricalMeasurementFZ],
    toZigbee: [],
    exposes: [indexEnergy(), ...exposesData],
    configure: async (device, coordinatorEndpoint, logger) => {
        const SW1_ENDPOINT = 1;
        const endpoint = device.getEndpoint(SW1_ENDPOINT);

        // ZLinky don't emit divisor and multiplier
        endpoint.saveClusterAttributeKeyValue('haElectricalMeasurement', { acCurrentDivisor: 1, acCurrentMultiplier: 1 });
        endpoint.saveClusterAttributeKeyValue('seMetering', { divisor: 1, multiplier: 1 });

        for (let reportable of dataReportable) {
            logger.debug(`ZLINKY_TIC: Start configure reporting for ${reportable.name} (${reportable.cluster}/${reportable.attribut}).`);
            endpoint.configureReporting(reportable.cluster || reportable.clusterId,
                [{
                    attribute: reportable.attribut || reportable.attributId,
                    minimumReportInterval: 1,
                    maximumReportInterval: repInterval.MINUTES_5,
                    reportableChange: 1,
                }]).then(() => {
                    logger.debug(`ZLINKY_TIC: ${reportable.name} (${reportable.cluster}/${reportable.attribut}) report successfully configured.`);
                }).catch(e => { // Bug on firmware v1.0.0 (2021 11 01) -> Some attributs reportable cannot be configured
                    logger.warning(`ZLINKY_TIC: Failed to configure reporting for ${reportable.name} (${reportable.cluster}/${reportable.attribut}). Adding in polling attributs list.`)
                    dataNonReportable.push(reportable);
                });
        }

        //Read some value one time for optimisation
        for (let data of dataNonReportable.filter(d => d.cluster).filter(d => d.attribut).filter(d => d.onetime)) {
            endpoint.read(data.cluster, [data.attribut]);
        }

    },
    options: [options_measurement_poll_interval],
    onEvent: async (type, data, device, options) => {
        const endpoint = device.getEndpoint(1);
        const intervalDefined = globalStore.hasValue(device, 'interval');
        if (type === 'stop') {
            clearInterval(globalStore.getValue(device, 'interval'));
            globalStore.clearValue(device, 'interval');
        } else if (!intervalDefined) {

            // periodic scan for non-reportable attributs
            const seconds = options && options.measurement_poll_interval ? options.measurement_poll_interval : 120;
            const interval = setInterval(async () => {
                try {
                    await poll(endpoint);
                } catch (error) {/* Do nothing*/ }
            }, seconds * 1000);
            globalStore.putValue(device, 'interval', interval);
            globalStore.putValue(device, 'interval_seconds', seconds);

            try {
                await poll(endpoint);
            } catch (e) { }

        } else {
            if (intervalDefined) {
                const seconds = options && options.measurement_poll_interval ? options.measurement_poll_interval : 120;
                const defined_seconds = globalStore.getValue(device, 'interval_seconds');
                if (seconds != defined_seconds) {
                    clearInterval(globalStore.getValue(device, 'interval'));
                    const interval = setInterval(async () => {
                        try {
                            await poll(endpoint);
                        } catch (error) {/* Do nothing*/ }
                    }, seconds * 1000);
                    globalStore.putValue(device, 'interval', interval);
                    globalStore.putValue(device, 'interval_seconds', seconds);
                }
            }
        }
    }
};

module.exports = definition;