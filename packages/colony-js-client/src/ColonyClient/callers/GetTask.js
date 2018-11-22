/* @flow */
/* eslint-disable no-underscore-dangle */

import assert from 'assert';
import BigNumber from 'bn.js';
import ContractClient from '@colony/colony-js-contract-client';
import { isBigNumber } from '@colony/colony-js-utils';
import { TASK_STATUSES } from '../../constants';

import type ColonyClient from '../index';

type InputValues = { taskId: number };
type CallResult = [
  string,
  string,
  boolean,
  number,
  number,
  number,
  number,
  number,
  number,
  [number], // Currently just one item
];

export default class GetTask extends ContractClient.Caller<
  InputValues,
  // Flow is confused by the call to `super.convertOutputValues`, so let the
  // OutputValues generic pass through for now; it's overspecified
  *,
  ColonyClient,
> {
  constructor(params: *) {
    super({
      functionName: 'getTask',
      input: [['taskId', 'number']],
      output: [
        ['specificationHash', 'ipfsHash'],
        ['deliverableHash', 'ipfsHash'],
        ['status', 'taskStatus'],
        ['dueDate', 'date'],
        ['payoutsWeCannotMake', 'number'],
        ['potId', 'number'],
        ['completionDate', 'date'],
        ['domainId', 'number'],
        ['skillId', 'number'],
      ],
      ...params,
    });
    this._validateEmpty = async (inputValues?: *) => {
      const taskId = inputValues && inputValues.taskId;
      if (taskId) {
        const { count } = await this.client.getTaskCount.call();
        assert(taskId <= count, `Task with ID ${taskId} not found`);
      }
      return true;
    };
  }
  // eslint-disable-next-line class-methods-use-this
  convertOutputValues(result: CallResult, { taskId }: *) {
    const values = [].concat(result);

    const parsedResult = this.output.reduce(
      (acc, [name], index) => Object.assign(acc, { [name]: values[index] }),
      {},
    );

    const task = super.convertOutputValues(parsedResult);

    // Until arrays of bignumbers are supported as a parameter type,
    // take the last item of the call result (skillIds) and use the first one
    const skillId: BigNumber = [].concat(result[result.length - 1])[0];

    Object.keys(parsedResult).forEach(key => {
      if (key === 'skillId') {
        // Convert bignumbers to numbers for skillId
        parsedResult[key] = isBigNumber(skillId) ? skillId.toNumber() : skillId;
      } else {
        // Convert bignumbers to numbers
        parsedResult[key] = isBigNumber(parsedResult[key])
          ? parsedResult[key].toNumber()
          : parsedResult[key];
      }
      // Convert status number to name
      if (key === 'status') {
        parsedResult[key] = Object.keys(TASK_STATUSES).find(
          name => TASK_STATUSES[name] === parsedResult[key],
        );
      }
    });

    return Object.assign({}, task, {
      // Include the task ID
      id: taskId,
      ...parsedResult,
    });
  }
}
