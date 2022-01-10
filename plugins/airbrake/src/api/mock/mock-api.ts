/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Groups } from '../airbrake-groups';
import { AirbrakeApi } from '../airbrake-api';
import mockGroupsData from './airbrake-groups-api-mock.json';

export class MockAirbrakeApi implements AirbrakeApi {
  fetchGroups(): Promise<Groups> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockGroupsData), 800);
    });
  }
}
