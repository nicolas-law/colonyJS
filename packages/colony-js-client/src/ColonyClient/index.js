/* @flow */

import assert from 'assert';

import type BigNumber from 'bn.js';

import ContractClient from '@colony/colony-js-contract-client';
import { isValidAddress } from '@colony/colony-js-utils';
// eslint-disable-next-line max-len
import type { ContractClientConstructorArgs } from '@colony/colony-js-contract-client';

import ColonyNetworkClient from '../ColonyNetworkClient/index';
import TokenClient from '../TokenClient/index';
import AuthorityClient from '../AuthorityClient/index';
import GetTask from './callers/GetTask';
import CreateTask from './senders/CreateTask';
import {
  ROLES,
  WORKER_ROLE,
  EVALUATOR_ROLE,
  MANAGER_ROLE,
  DEFAULT_DOMAIN_ID,
  PARAMS,
} from '../constants';

type Address = string;
type TokenAddress = string;
type HexString = string;
type Role = $Keys<typeof ROLES>;
type IPFSHash = string;

export default class ColonyClient extends ContractClient {
  networkClient: ColonyNetworkClient;
  token: TokenClient;
  authority: AuthorityClient;

  /*
    Gets the colony's Authority contract address
  */
  getAuthority: ColonyClient.Caller<
    {},
    {
      address: Address, // The colony's Authority contract address
    },
    ColonyClient,
  >;
  /*
    Helper function used to generate the rating secret used in task ratings. Accepts a salt value and a value to hide, and returns the keccak256 hash of both.
  */
  generateSecret: ColonyClient.Caller<
    {
      salt: string, // Salt value.
      value: number, // Value to hide (typically a rating of 1-3).
    },
    {
      secret: HexString, // keccak256 hash of joint Salt and Value.
    },
    ColonyClient,
  >;
  /*
    Gets the selected domain's local skill ID and funding pot ID.
  */
  getDomain: ColonyClient.Caller<
    {
      domainId: number, // ID of the domain.
    },
    {
      localSkillId: number, // The domain's local skill ID.
      potId: number, // The domain's funding pot ID.
    },
    ColonyClient,
  >;
  /*
    Gets the total number of domains in a Colony. This number equals the last `domainId` created.
  */
  getDomainCount: ColonyClient.Caller<
    {},
    {
      count: number, // Number of all domain in this Colony; == the last added domainId.
    },
    ColonyClient,
  >;
  /*
    Gets the total number of reward payout cycles.
  */
  getGlobalRewardPayoutCount: ColonyClient.Caller<
    {},
    {
      count: number, // Number of reward payout cycles.
    },
    ColonyClient,
  >;
  /*
    Gets the number of claimed and waived reward payouts for a given user.
  */
  getUserRewardPayoutCount: ColonyClient.Caller<
    {
      user: Address, // Address of user.
    },
    {
      count: number, // Number of claimed and waived reward payouts.
    },
    ColonyClient,
  >;
  /*
    Gets the total number of tasks in a Colony. This number equals the last `taskId` created.
  */
  getTaskCount: ColonyClient.Caller<
    {},
    {
      count: number, // Total number of tasks in this Colony.
    },
    ColonyClient,
  >;
  /*
    Gets a certain task defined by its integer taskId.
  */
  getTask: ColonyClient.Caller<
    { taskId: number },
    {
      cancelled: boolean, // Boolean flag denoting whether the task is cancelled.
      deliverableDate: ?Date, // Date when the deliverable is due.
      deliverableHash: ?IPFSHash, // Unique hash of the deliverable content.
      domainId: number, // Integer Domain ID the task belongs to.
      dueDate: ?Date, // When the task is due.
      finalized: boolean, // Boolean flag denoting whether the task is finalized.
      id: number, // Integer task ID.
      payoutsWeCannotMake: ?number, // Number of payouts that cannot be completed with the current task funding.
      potId: ?number, // Integer ID of funding pot for the task.
      skillId: number, // Integer Skill ID the task is assigned to.
      specificationHash: IPFSHash, // Unique hash of the specification content.
    },
    ColonyClient,
  >;
  /*
    Given a specific task, a defined role for the task, and a token address, will return any payout attached to the task in the token specified.
  */
  getTaskPayout: ColonyClient.Caller<
    {
      taskId: number, // Integer taskId.
      role: Role, // Role the payout is specified for: MANAGER, EVALUATOR, or WORKER.
      token: TokenAddress, // Address of the token's contract. `0x0` value indicates Ether.
    },
    {
      amount: BigNumber, // Amount of specified tokens to payout for that task and a role.
    },
    ColonyClient,
  >;
  /*
    Every task has three roles associated with it which determine permissions for editing the task, submitting work, and ratings for performance.
  */
  getTaskRole: ColonyClient.Caller<
    {
      taskId: number, // Integer taskId.
      role: Role, // MANAGER, EVALUATOR, or WORKER.
    },
    {
      address: Address, // Address of the user for the given role.
      rated: boolean, // Has the user work been rated.
      rating: number, // Rating the user received (1-3).
    },
    ColonyClient,
  >;
  /*
    For a given task, will return the number of submitted ratings and the date of their submission.
  */
  getTaskWorkRatings: ColonyClient.Caller<
    {
      taskId: number, // Integer taskId.
    },
    {
      count: number, // Total number of submitted ratings for a task.
      date: Date, // Date of the last submitted rating.
    },
    ColonyClient,
  >;
  /*
    If ratings for a task are still in the commit period, their ratings will still be hidden, but the hashed value can still be returned.
  */
  getTaskWorkRatingSecret: ColonyClient.Caller<
    {
      taskId: number, // Integer taskId.
      role: Role, // Role that submitted the rating: MANAGER, EVALUATOR, or WORKER.
    },
    {
      secret: HexString, // the hashed rating (equivalent to the output of `keccak256(_salt, _rating)`).
    },
    ColonyClient,
  >;
  /*
    Gets a balance for a certain token in a specific pot.
  */
  getPotBalance: ColonyClient.Caller<
    {
      potId: number, // Integer potId.
      token: TokenAddress, // Address to get funds from, such as the token contract address, or empty address (`0x0` for Ether)
    },
    {
      balance: BigNumber, // Balance for token `token` in pot `potId`.
    },
    ColonyClient,
  >;
  /*
    The `nonRewardPotsTotal` is a value that keeps track of the total assets a colony has to work with, which may be split among several distinct pots associated with various domains and tasks.
  */
  getNonRewardPotsTotal: ColonyClient.Caller<
    {
      token: TokenAddress, // Address of the token's contract. `0x0` value indicates Ether.
    },
    {
      total: BigNumber, // All tokens that are not within the colony's `rewards` pot.
    },
    ColonyClient,
  >;
  /*
    Given a specific payout, returns useful information about the payout.
  */
  getRewardPayoutInfo: ColonyClient.Caller<
    {
      payoutId: number, // Id of the reward payout.
    },
    {
      blockNumber: number, // Block number at the time of creation.
      remainingTokenAmount: BigNumber, // Remaining (unclaimed) amount of tokens.
      reputationRootHash: string, // Reputation root hash at the time of creation.
      token: TokenAddress, // Token address (`0x0` value indicates Ether).
      totalTokenAmountForRewardPayout: BigNumber, // Total amount of tokens taken aside for reward payout.
      totalTokens: BigNumber, // Total colony tokens at the time of creation.
    },
    ColonyClient,
  >;
  /*
    Gets the address of the colony's official token contract.
  */
  getToken: ColonyClient.Caller<
    {},
    {
      address: Address, // The address of the colony's official deployed token contract
    },
    ColonyClient,
  >;
  /*
    Returns the total number of transactions the colony has made, == the `transactionId` of the last added transaction to the Colony.
  */
  getTransactionCount: ColonyClient.Caller<
    {},
    {
      count: number, // Number of all transactions in this Colony; == the last added transactionId.
    },
    ColonyClient,
  >;
  /*
    Creates a new task by invoking `makeTask` on-chain.
  */
  createTask: ColonyClient.Sender<
    {
      specificationHash: IPFSHash, // Hashed output of the task's work specification, stored so that it can later be referenced for task ratings or in the event of a dispute.
      domainId: number, // Domain in which the task has been created (default value: `1`).
    },
    {
      taskId: number, // Will return an integer taskId, from the `TaskAdded` event.
    },
    ColonyClient,
  >;
  /*
    The task brief, or specification, is a description of the tasks work specification. The description is hashed and stored with the task for future reference in ratings or in the event of a dispute.
  */
  setTaskBrief: ColonyClient.MultisigSender<
    {
      taskId: number, // Integer taskId.
      specificationHash: IPFSHash, // digest of the task's hashed specification.
    },
    {},
    ColonyClient,
  >;
  /*
    Every task must belong to a single existing Domain. This can only be called by the manager of the task.
  */
  setTaskDomain: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      domainId: number, // Integer domainId.
    },
    {},
    ColonyClient,
  >;
  /*
    The task's due date determines when a worker may submit the task's deliverable(s).
  */
  setTaskDueDate: ColonyClient.MultisigSender<
    {
      taskId: number, // Integer taskId.
      dueDate: Date, // Due date.
    },
    {},
    ColonyClient,
  >;
  /*
  Sets the skill tag associated with the task. Currently there is only one skill tag available per task, but additional skills for tasks are planned in future implementations. This can only be called by the manager of the task.
  */
  setTaskSkill: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      skillId: number, // Integer skillId.
    },
    {},
    ColonyClient,
  >;
  /*
    Sets the payout given to the EVALUATOR role when the task is finalized.
  */
  setTaskEvaluatorPayout: ColonyClient.MultisigSender<
    {
      taskId: number, // Integer taskId.
      token: TokenAddress, // Address to send funds from, e.g. the token's contract address, or empty address (`0x0` for Ether)
      amount: BigNumber, // Amount to be paid.
    },
    {},
    ColonyClient,
  >;
  /*
    Sets the payout given to the MANAGER role when the task is finalized. This Sender can only be called by the manager for the task in question.
  */
  setTaskManagerPayout: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      token: TokenAddress, // Address to send funds from, e.g. the token's contract address, or empty address (`0x0` for Ether)
      amount: BigNumber, // Amount to be paid.
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Set new colony owner role.
    /// @dev There can only be one address assigned to owner role at a time.
    /// Whoever calls this function will lose their owner role
    /// Can be called by owner role.
  */
  setOwner: ColonyClient.Sender<
    {
      user: Address, // User we want to give an owner role to
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Set new colony admin role.
    /// Can be called by owner role or admin role.
  */
  setAdmin: ColonyClient.Sender<
    {
      user: Address, // User we want to give an admin role to
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Remove colony admin.
    /// Can only be called by owner role.
  */
  removeAdmin: ColonyClient.Sender<
    {
      user: Address, // User we want to remove admin role from
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
  /// @notice Assigning manager role
  /// Current manager and user we want to assign role to both need to agree
  /// User we want to set here also needs to be an admin
  /// @dev This function can only be called through `executeTaskRoleAssignment`
  /// @param _id Id of the task
  /// @param _user Address of the user we want to give a manager role to
  // function setTaskManagerRole(uint256 _id, address _user) public;
  */
  setTaskManager: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      user: Address, // Address of the user we want to give a manager role to
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Assigning evaluator role
    /// Can only be set if there is no one currently assigned to be an evaluator
    /// Manager of the task and user we want to assign role to both need to agree
    /// Managers can assign themselves to this role, if there is no one currently assigned to it
    /// @dev This function can only be called through `executeTaskRoleAssignment`
    /// @param _id Id of the task
    /// @param _user Address of the user we want to give a evaluator role to
    // function setTaskEvaluatorRole(uint256 _id, address _user) public;
   */
  setTaskEvaluator: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      user: Address, // Address of the user we want to give an evaluator role to
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Assigning worker role
    /// Can only be set if there is no one currently assigned to be a worker
    /// Manager of the task and user we want to assign role to both need to agree
    /// @dev This function can only be called through `executeTaskRoleAssignment`
    /// @param _id Id of the task
    /// @param _user Address of the user we want to give a worker role to
    // function setTaskWorkerRole(uint256 _id, address _user) public;
   */
  setTaskWorker: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      user: Address, // Address of the user we want to give an evaluator role to
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Removing evaluator role
    /// Agreed between manager and currently assigned evaluator
    /// @param _id Id of the task
    // function removeTaskEvaluatorRole(uint256 _id) public;
   */
  removeTaskEvaluator: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
    },
    {},
    ColonyClient,
  >;
  /*
    TODO
    /// @notice Removing worker role
    /// Agreed between manager and currently assigned worker
    /// @param _id Id of the task
    // function removeTaskWorkerRole(uint256 _id) public;
   */
  removeTaskWorker: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
    },
    {},
    ColonyClient,
  >;
  /*
    Sets the payout given to the WORKER role when the task is finalized.
  */
  setTaskWorkerPayout: ColonyClient.MultisigSender<
    {
      taskId: number, // Integer taskId.
      token: TokenAddress, // Address to send funds from, e.g. the token's contract address, or empty address (`0x0` for Ether)
      amount: BigNumber, // Amount to be paid.
    },
    {},
    ColonyClient,
  >;
  /*
    Submit the task deliverable, i.e. the output of the work performed for task `_id` Submission is allowed only to the assigned worker before the task due date. Submissions cannot be overwritten.
  */
  submitTaskDeliverable: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      deliverableHash: IPFSHash, // Hash of the work performed.
    },
    {},
    ColonyClient,
  >;
  /*
    Submits a hidden work rating for a task. This is generated by generateSecret(_salt, _rating).
  */
  submitTaskWorkRating: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      role: Role, // The role submitting their rating, either EVALUATOR or WORKER.
      secret: HexString, // hidden work rating, generated as the output of `generateSecret(_salt, _rating)`, where `_rating` is a score from 1-3.
    },
    {},
    ColonyClient,
  >;
  /*
    Reveals a previously submitted work rating, by proving that the `_rating` and `_salt` values result in the same `secret` submitted during the rating submission period. This is checked on-chain using the `generateSecret` function.
  */
  revealTaskWorkRating: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      role: Role, // Role revealing their rating submission, either EVALUATOR or WORKER.
      rating: number, // Rating scored (1-3).
      salt: string, // `_salt` value to be used in `generateSecret`. A correct value will result in the same `secret` submitted during the work rating submission period.
    },
    {},
    ColonyClient,
  >;
  /*
    In the event of a user not committing or revealing within the 10 day rating window, their rating of their counterpart is assumed to be the highest possible and they will receive a reputation penalty.
  */
  assignWorkRating: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
    },
    {},
    ColonyClient,
  >;
  /*
    Cancels a task.
  */
  cancelTask: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
    },
    {},
    ColonyClient,
  >;
  /*
    Finalizes a task, allowing roles to claim payouts and prohibiting all further changes to the task.
  */
  finalizeTask: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
    },
    {},
    ColonyClient,
  >;
  /*
    Claims the payout for `token` denomination for work completed in task `taskId` by contributor with role `role`. Allowed only by the contributors themselves after task is finalized. Here the network receives its fee from each payout. Ether fees go straight to the Meta Colony whereas Token fees go to the Network to be auctioned off.
  */
  claimPayout: ColonyClient.Sender<
    {
      taskId: number, // Integer taskId.
      role: Role, // Role of the contributor claiming the payout: MANAGER, EVALUATOR, or WORKER
      token: TokenAddress, // Address to claim funds from, e.g. the token's contract address, or empty address (`0x0` for Ether)
    },
    {},
    ColonyClient,
  >;
  /*
    Adds a domain to the Colony along with the new domain's respective local skill. This can only be called by owners of the colony.
  */
  addDomain: ColonyClient.Sender<
    {
      parentSkillId: number, // Id of the local skill under which the new skill will be added.
    },
    {
      skillId: number, // A skillId for this domain.
      parentSkillId: number, // The parent skill id.
    },
    ColonyClient,
  >;
  /*
    Adds a global skill under a given parent SkillId. This can only be called from the Meta Colony, and only by the Meta Colony owners.
  */
  addGlobalSkill: ColonyClient.Sender<
    {
      parentSkillId: number, // Integer id of the parent skill.
    },
    {
      skillId: number, // Integer id of the newly created skill.
      parentSkillId: number, // Integer id of the parent skill.
    },
    ColonyClient,
  >;
  /*
    Move any funds received by the colony for `token` denomination to the top-levl domain pot, siphoning off a small amount to the rewards pot. No fee is taken if called against a colony's own token.
  */
  claimColonyFunds: ColonyClient.Sender<
    {
      token: TokenAddress, // Address to claim funds from; empty address (`0x0` for Ether)
    },
    {},
    ColonyClient,
  >;
  /*
    Finalises the reward payout and allows creation of next reward payout for token that has been used in `payoutId`. Can only be called when reward payout cycle is finished, i.e. 60 days from its creation.
  */
  finalizeRewardPayout: ColonyClient.Sender<
    {
      payoutId: number, // Id of the reward payout.
    },
    {},
    ColonyClient,
  >;
  /*
    Move a given amount of `token` funds from one pot to another.
  */
  moveFundsBetweenPots: ColonyClient.Sender<
    {
      fromPot: number, // Origin pot Id.
      toPot: number, // Destination pot Id.
      amount: BigNumber, // Amount of funds to move.
      token: TokenAddress, // Address of the token contract (`0x0` value indicates Ether).
    },
    {},
    ColonyClient,
  >;
  /*
    The owner of a Colony may mint new tokens.
  */
  mintTokens: ColonyClient.Sender<
    {
      amount: BigNumber, // Amount of new tokens to be minted.
    },
    {},
    ColonyClient,
  >;
  /*
    In the case of the Colony Network, only the Meta Colony may mint new tokens.
  */
  mintTokensForColonyNetwork: ColonyClient.Sender<
    {
      amount: BigNumber, // Amount of new tokens to be minted.
    },
    {},
    ColonyClient,
  >;
  /*
    Start the next reward payout for `token`. All funds in the reward pot for `token` will become unavailable. All tokens will be locked, and can be unlocked by calling `waiveRewardPayout` or `claimRewardPayout`.
  */
  startNextRewardPayout: ColonyClient.Sender<
    {
      token: TokenAddress, // Address of token used for reward payout (`0x0` value indicates Ether).
    },
    {},
    ColonyClient,
  >;
  /*
    Waive reward payout. This unlocks the sender's tokens and increments the users reward payout counter, allowing them to claim the next reward payout.
  */
  waiveRewardPayouts: ColonyClient.Sender<
    {
      numPayouts: number, // Number of payouts to waive.
    },
    {},
    ColonyClient,
  >;

  events: {
    DomainAdded: ContractClient.Event<{ id: number }>,
    PotAdded: ContractClient.Event<{ id: number }>,
    TaskAdded: ContractClient.Event<{ id: number }>,
    TaskBriefChanged: ContractClient.Event<{
      id: number,
      specificationHash: string,
    }>,
    TaskDueDateChanged: ContractClient.Event<{
      id: number,
      dueDate: Date,
    }>,
    TaskDomainChanged: ContractClient.Event<{
      id: number,
      domainId: number,
    }>,
    TaskSkillChanged: ContractClient.Event<{
      id: number,
      skillId: number,
    }>,
    TaskRoleUserChanged: ContractClient.Event<{
      id: number,
      role: number,
      user: Address,
    }>,
    TaskWorkerPayoutChanged: ContractClient.Event<{
      id: number,
      token: TokenAddress,
      amount: number,
    }>,
    TaskFinalized: ContractClient.Event<{
      id: number,
    }>,
    TaskCanceled: ContractClient.Event<{
      id: number,
    }>,
  };

  static get defaultQuery() {
    return {
      contractName: 'IColony',
    };
  }

  constructor({
    adapter,
    authority,
    networkClient,
    query,
    token,
  }: {
    authority?: AuthorityClient,
    networkClient?: ColonyNetworkClient,
    token?: TokenClient,
  } & ContractClientConstructorArgs) {
    super({ adapter, query });

    if (!(networkClient instanceof ColonyNetworkClient))
      throw new Error(
        'A `networkClient` property must be supplied ' +
          '(an instance of `ColonyNetworkClient`)',
      );

    this.networkClient = networkClient;
    if (token) this.token = token;
    if (authority) this.authority = authority;

    return this;
  }

  async init() {
    await super.init();

    const { address: tokenAddress } = await this.getToken.call();
    if (!(this.token instanceof TokenClient)) {
      this.token = new TokenClient({
        adapter: this.adapter,
        query: { contractAddress: tokenAddress },
      });
      await this.token.init();
    }

    const { address: authorityAddress } = await this.getAuthority.call();
    if (!(this.authority instanceof AuthorityClient)) {
      this.authority = new AuthorityClient({
        adapter: this.adapter,
        query: { contractAddress: authorityAddress },
      });
      await this.authority.init();
    }

    return this;
  }

  initializeContractMethods() {
    this.getTask = new GetTask({ client: this });

    const makeTaskCaller = (
      name: string,
      input: Array<any>,
      output: Array<any>,
    ) =>
      this.addCaller(name, {
        input: [PARAMS.TASK_ID, ...input],
        output,
        validateEmpty: async ({ taskId }: { taskId: number }) => {
          const { count } = await this.getTaskCount.call();
          assert(taskId <= count, `Task with ID ${taskId} not found`);
          return true;
        },
      });

    makeTaskCaller(
      'getTaskPayout',
      [PARAMS.ROLE, PARAMS.TOKEN],
      [PARAMS.AMOUNT],
    );
    makeTaskCaller(
      'getTaskRole',
      [PARAMS.ROLE],
      [PARAMS.ADDRESS, ['rated', 'boolean'], ['rating', 'number']],
    );
    makeTaskCaller('getTaskWorkRatings', [], [PARAMS.COUNT, ['date', 'date']]);
    makeTaskCaller(
      'getTaskWorkRatingSecret',
      [PARAMS.ROLE],
      [['secret', 'hexString']],
    );

    // Callers
    this.addCaller('getAuthority', {
      functionName: 'authority',
      output: [PARAMS.ADDRESS],
    });
    this.addCaller('generateSecret', {
      input: [['salt', 'string'], ['value', 'number']],
      output: [['secret', 'hexString']],
    });
    this.addCaller('getDomain', {
      input: [PARAMS.DOMAIN_ID],
      output: [['localSkillId', 'number'], ['potId', 'number']],
      validateEmpty: async ({ domainId }: { domainId: number }) => {
        const { count } = await this.getDomainCount.call();
        if (domainId > count)
          throw new Error(`Domain ID ${domainId} not found`);
        return true;
      },
    });
    this.addCaller('getDomainCount', {
      output: [PARAMS.COUNT],
    });
    this.addCaller('getGlobalRewardPayoutCount', {
      output: [PARAMS.COUNT],
    });
    this.addCaller('getUserRewardPayoutCount', {
      input: [PARAMS.USER],
      output: [PARAMS.COUNT],
    });
    this.addCaller('getNonRewardPotsTotal', {
      input: [PARAMS.TOKEN],
      output: [['total', 'bigNumber']],
    });
    this.addCaller('getPotBalance', {
      input: [['potId', 'number'], PARAMS.TOKEN],
      output: [['balance', 'bigNumber']],
    });
    this.addCaller('getRewardPayoutInfo', {
      input: [['payoutId'], 'number'],
      output: [
        ['reputationRootHash', 'string'],
        ['totalTokens', 'bigNumber'],
        ['totalTokenAmountForRewardPayout', 'bigNumber'],
        ['remainingTokenAmount', 'bigNumber'],
        PARAMS.TOKEN,
        ['blockNumber', 'number'],
      ],
    });
    this.addCaller('getTaskCount', {
      output: [PARAMS.COUNT],
    });
    this.addCaller('getToken', {
      output: [PARAMS.ADDRESS],
    });

    // Events
    this.addEvent('DomainAdded', [PARAMS.ID]);
    this.addEvent('PotAdded', [PARAMS.ID]);
    this.addEvent('TaskAdded', [PARAMS.ID]);
    this.addEvent('TaskBriefChanged', [PARAMS.ID, PARAMS.SPEC_HASH]);
    this.addEvent('TaskDueDateChanged', [PARAMS.ID, PARAMS.DUE_DATE]);
    this.addEvent('TaskDomainChanged', [PARAMS.ID, PARAMS.DOMAIN_ID]);
    this.addEvent('TaskSkillChanged', [PARAMS.ID, PARAMS.SKILL_ID]);
    this.addEvent('TaskRoleUserChanged', [PARAMS.ID, PARAMS.ROLE, PARAMS.USER]);
    this.addEvent('TaskWorkerPayoutChanged', [
      PARAMS.ID,
      PARAMS.TOKEN,
      PARAMS.AMOUNT,
    ]);
    this.addEvent('TaskDeliverableSubmitted', [
      PARAMS.ID,
      PARAMS.DELIVERABLE_HASH,
    ]);
    this.addEvent('TaskWorkRatingRevealed', [
      PARAMS.ID,
      // $FlowFixMe
      PARAMS.ROLE,
      ['rating', 'number'],
    ]);
    this.addEvent('TaskFinalized', [PARAMS.ID]);
    this.addEvent('TaskCanceled', [PARAMS.ID]);

    // Senders
    const SkillAdded = {
      contract: this.networkClient.contract,
      handler({
        parentSkillId,
        skillId,
      }: {
        parentSkillId: BigNumber,
        skillId: BigNumber,
      }) {
        return {
          parentSkillId: parentSkillId.toNumber(),
          skillId: skillId.toNumber(),
        };
      },
    };
    const DomainAdded = {
      contract: this.contract,
      handler({ id }: { id: BigNumber }) {
        return {
          domainId: id.toNumber(),
        };
      },
    };
    const PotAdded = {
      contract: this.contract,
      handler({ id }: { id: BigNumber }) {
        return {
          potId: id.toNumber(),
        };
      },
    };

    this.addSender('addDomain', {
      input: [['parentSkillId', 'number']],
      eventHandlers: {
        DomainAdded,
        PotAdded,
        SkillAdded,
      },
    });
    this.addSender('addGlobalSkill', {
      input: [['parentSkillId', 'number']],
      eventHandlers: {
        SkillAdded,
      },
    });
    this.addSender('assignWorkRating', {
      input: [PARAMS.TASK_ID],
    });
    this.addSender('cancelTask', {
      input: [PARAMS.TASK_ID],
    });
    this.addSender('claimColonyFunds', {
      input: [PARAMS.TOKEN],
    });
    this.addSender('claimPayout', {
      input: [PARAMS.TASK_ID, PARAMS.ROLE, PARAMS.TOKEN],
    });
    this.createTask = new CreateTask({
      client: this,
      name: 'createTask',
      functionName: 'makeTask',
      input: [PARAMS.SPEC_HASH, PARAMS.DOMAIN_ID],
      defaultValues: {
        domainId: DEFAULT_DOMAIN_ID,
      },
      eventHandlers: {
        TaskAdded: {
          contract: this.contract,
          handler({ id }: { id: BigNumber }) {
            return {
              taskId: id.toNumber(),
            };
          },
        },
        PotAdded,
      },
    });
    this.addSender('finalizeTask', {
      input: [PARAMS.TASK_ID],
    });
    this.addSender('finalizeRewardPayout', {
      input: [['payoutId', 'number']],
    });
    this.addSender('mintTokens', {
      input: [PARAMS.AMOUNT],
    });
    this.addSender('mintTokensForColonyNetwork', {
      input: [PARAMS.AMOUNT],
    });
    this.addSender('moveFundsBetweenPots', {
      input: [
        ['fromPot', 'number'],
        ['toPot', 'number'],
        PARAMS.AMOUNT,
        PARAMS.TOKEN,
      ],
    });
    this.addSender('revealTaskWorkRating', {
      input: [
        PARAMS.TASK_ID,
        PARAMS.ROLE,
        ['rating', 'number'],
        ['salt', 'string'],
      ],
    });
    this.addSender('setTaskDomain', {
      input: [PARAMS.TASK_ID, PARAMS.DOMAIN_ID],
    });
    this.addSender('setOwner', {
      input: [PARAMS.USER],
    });
    this.addSender('setAdmin', {
      input: [PARAMS.USER],
    });
    this.addSender('removeAdmin', {
      input: [PARAMS.USER],
    });
    this.addSender('setTaskManager', {
      input: [PARAMS.TASK_ID, PARAMS.USER],
    });
    this.addSender('setTaskEvaluator', {
      input: [PARAMS.TASK_ID, PARAMS.USER],
    });
    this.addSender('setTaskWorker', {
      input: [PARAMS.TASK_ID, PARAMS.USER],
    });
    this.addSender('removeTaskEvaluator', {
      input: [PARAMS.TASK_ID],
    });
    this.addSender('removeTaskWorker', {
      input: [PARAMS.TASK_ID],
    });
    this.addSender('setTaskManagerPayout', {
      input: [PARAMS.TASK_ID, PARAMS.TOKEN, PARAMS.AMOUNT],
    });
    this.addSender('setTaskSkill', {
      input: [PARAMS.TASK_ID, PARAMS.SKILL_ID],
    });
    this.addSender('submitTaskDeliverable', {
      input: [PARAMS.TASK_ID, PARAMS.DELIVERABLE_HASH],
    });
    this.addSender('startNextRewardPayout', {
      input: [PARAMS.TOKEN],
    });
    this.addSender('waiveRewardPayouts', {
      input: [['numPayouts', 'number']],
    });
    this.addSender('submitTaskWorkRating', {
      input: [PARAMS.TASK_ID, PARAMS.ROLE, ['secret', 'hexString']],
    });

    // Multisig Senders
    const taskMultisig = (
      multisigFunctionName,
      name: string,
      input: Array<*>,
      roles: Array<Role> = [],
    ) =>
      this.addMultisigSender(name, {
        input: [PARAMS.TASK_ID, ...input],
        getRequiredSignees: async ({ taskId }: { taskId: number }) => {
          const taskRoles = await Promise.all(
            roles.map(role => this.getTaskRole.call({ taskId, role })),
          );
          return taskRoles.map(({ address }) => address).filter(isValidAddress);
        },
        multisigFunctionName,
        nonceFunctionName: 'getTaskChangeNonce',
        nonceInput: [PARAMS.TASK_ID],
      });
    const executeTaskChange = taskMultisig.bind(this, 'executeTaskChange');
    const executeTaskRoleAssignment = taskMultisig.bind(
      this,
      'executeTaskRoleAssignment',
    );

    executeTaskChange(
      'setTaskBrief',
      [PARAMS.SPEC_HASH],
      [MANAGER_ROLE, WORKER_ROLE],
    );
    executeTaskChange(
      'setTaskDueDate',
      [PARAMS.DUE_DATE],
      [MANAGER_ROLE, WORKER_ROLE],
    );
    executeTaskChange(
      'setTaskWorkerPayout',
      [PARAMS.TOKEN, PARAMS.AMOUNT],
      [MANAGER_ROLE, WORKER_ROLE],
    );
    executeTaskChange(
      'setTaskEvaluatorPayout',
      [PARAMS.TOKEN, PARAMS.AMOUNT],
      [MANAGER_ROLE, EVALUATOR_ROLE],
    );
    executeTaskRoleAssignment('setTaskManagerRole', [PARAMS.USER]);
    executeTaskRoleAssignment('setTaskWorkerRole', [PARAMS.USER]);
    executeTaskRoleAssignment('setTaskEvaluatorRole', [PARAMS.USER]);
    executeTaskRoleAssignment('removeTaskWorkerRole', []);
    executeTaskRoleAssignment('removeTaskEvaluatorRole', []);
  }
}
