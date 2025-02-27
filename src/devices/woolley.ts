import * as exposes from '../lib/exposes';
import * as utils from '../lib/utils';
import * as reporting from '../lib/reporting';
import fz from '../converters/fromZigbee';
import tz from '../converters/toZigbee';
import {Definition, Fz, KeyValue} from '../lib/types';
const e = exposes.presets;

const fzLocal = {
    BSD29: {
        cluster: '64529',
        type: ['attributeReport', 'readResponse'],
        options: [
            exposes.options.calibration('power', 'percentual'), exposes.options.precision('power'),
            exposes.options.calibration('current', 'percentual'), exposes.options.precision('current'),
            exposes.options.calibration('voltage', 'percentual'), exposes.options.precision('voltage'),
        ],
        convert: (model, msg, publish, options, meta) => {
            if (utils.hasAlreadyProcessedMessage(msg, model)) return;
            const lookup = [
                {key: '28678', name: 'power', factor: 'acPower'},
                {key: '28677', name: 'voltage', factor: 'acVoltage'},
                {key: '28676', name: 'current', factor: 'acCurrent'},
            ];
            const payload: KeyValue = {};
            for (const entry of lookup) {
                if (msg.data.hasOwnProperty(entry.key)) {
                    const value = msg.data[entry.key] / 1000;
                    payload[entry.name] = utils.calibrateAndPrecisionRoundOptions(value, options, entry.name);
                }
            }
            return payload;
        },
    } as Fz.Converter,
};

const definitions: Definition[] = [
    {
        zigbeeModel: ['CK-BL702-SWP-01(7020)'],
        model: 'BSD29',
        vendor: 'Woolley',
        description: 'Zigbee 3.0 smart plug 13A (UK version)',
        fromZigbee: [fz.on_off_skip_duplicate_transaction, fzLocal.BSD29],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff']);
            await reporting.onOff(endpoint);
            device.powerSource = 'Mains (single phase)';
            device.save();
        },
        exposes: [e.power(), e.current(), e.voltage(), e.switch()],
    },
];

module.exports = definitions;
