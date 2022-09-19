// SPDX-License-Identifier: BSD-3-Clause
/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2022, Collective.XYZ
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import Web3 from 'web3';
import { Config } from './config';
import { GovernanceBuilder } from './governancebuilder';
import { VoterClassFactory } from './voterclassfactory';
import { LoggerFactory } from './logging';
import { EthWallet } from './wallet';

const logger = LoggerFactory.getLogger(module.filename);

const run = async () => {
  try {
    const config = new Config();
    const web3 = new Web3(config.rpcUrl);
    const wallet = new EthWallet(config.privateKey, web3);
    wallet.connect();
    logger.info(`Wallet connected: ${wallet.getAddress()}`);

    if (!config.voterClass) {
      logger.info('Building VoterClass');
      const voterClassFactory = new VoterClassFactory(config.abiPath, config.voterFactory, web3, wallet, config.getGas());

      const classAddress = await voterClassFactory.createERC721(config.tokenContract, 1);
      logger.info(`VoterClass created at ${classAddress}`);
    } else {
      logger.info('Building Governance Contract');
      const governanceBuilder = new GovernanceBuilder(config.abiPath, config.builderAddress, web3, wallet, config.getGas());
      const name = await governanceBuilder.name();
      logger.info(name);
      await governanceBuilder.aGovernance();
      await governanceBuilder.withSupervisor(wallet.getAddress());
      await governanceBuilder.withVoterClassAddress(config.voterClass);
      const governanceAddress = await governanceBuilder.build();
      logger.info(`Governance contract created at ${governanceAddress}`);
    }
  } catch (error) {
    logger.error(error);
    throw new Error('Run failed');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => logger.error(error));