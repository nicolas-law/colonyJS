/* @flow */

export type ParamTypes =
  | 'address'
  | 'bigNumber'
  | 'boolean'
  | 'date'
  | 'hexString'
  | 'ipfsHash'
  | 'number'
  | 'tokenAddress'
  | 'role' // XXX this custom type is defined elsewhere (colony-js-client)
  | 'string';

// [param name, param type, default value (optional)]
export type Param = [string, ParamTypes];
export type Params = Array<Param>;

export type ParamTypeDef = {
  validate: (value: any) => boolean,
  convertOutput: (value: any) => *,
  convertInput: (value: any) => *,
};
