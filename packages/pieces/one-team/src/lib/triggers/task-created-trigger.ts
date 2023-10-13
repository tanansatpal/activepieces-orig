import {
    AuthenticationType,
    DedupeStrategy,
    httpClient,
    HttpHeaders,
    HttpMethod,
    Polling,
    pollingHelper
} from "@activepieces/pieces-common"
import {
    TriggerStrategy,
    createTrigger,
    StaticPropsValue, OAuth2PropertyValue
} from '@activepieces/pieces-framework'

import {oneTeamCommon} from "../common/common";
import {oneTeamAuth} from "../../index";

const props = {
    workspace_id: oneTeamCommon.workspace_id,
}

const itemPolling: Polling<any, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({auth, propsValue, lastFetchEpochMS}) => {
        const TEAM_URL = "https://jovt87luqa.execute-api.ap-south-1.amazonaws.com/dev/api/wot/module/search";
        const savedParams = propsValue['workspace_id'];
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const getTasksResponse = await httpClient.sendRequest<any>({
            method: HttpMethod.POST,
            url: TEAM_URL,
            headers: <HttpHeaders>{
                'Wot-Workspace-Id': savedParams.workspaceId,
                'Wot-User-Id': savedParams.wotUserId,
                'Userid': savedParams.userId,
                'Organizationid': savedParams.organisationId,
                'Iamuserid': savedParams.iamUserId,
                'Clientid': '634e809a1ac94f41fc07a832',
                'Apikey': 'b2w16qhe0p',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authProp['access_token'],
            },
            body: {
                "filter": {
                    "funct": {
                        "name": "largerEq",
                        "args": [
                            {
                                "name": "createdAt",
                                "type": "Field"
                            },
                            {
                                "name": lastFetchEpochMS,
                                "type": "Constant"
                            }
                        ]
                    }
                },
                "module": "TASK"
            }
        });
        const tasks = getTasksResponse.body.data;

        return tasks.map((record: any) => ({
            epochMilliSeconds: record.createdAt,
            data: record,
        })).reverse();
    }
};

export const taskItemCreatedTrigger = createTrigger({
    auth: oneTeamAuth,
    name: `one_team_task_created`,
    displayName: 'New Task Created',
    description: 'Triggered when a new task is created',
    props: {
        workspace_id: oneTeamCommon.workspace_id,
    },
    sampleData: {
        "_id": "6506d5eb9bc934bc200c98b4",
        "description": "",
        "workspaceId": "64f76ceb7a1eccf3b9062c8d",
        "thingId": "64f76cec46a8cedbee02184c",
        "userId": "64f76ceb1ed276af6a0074d0",
        "userName": "Akash Agrawal",
        "userInitials": "AA",
        "startTime": 1694946795107,
        "dueTime": 1695077940107,
        "stage": {
            "key": "stage_001",
            "value": "Pending",
            "description": "Pending",
            "status": "active",
            "lifecycle": "open",
            "color": "TBD",
            "badgeType": "TBD"
        },
        "timelineStatus": {
            "key": "delayed",
            "value": "Delayed",
            "description": "Delayed"
        },
        "priorityLevel": 1,
        "createdAt": 1694946795000,
        "createdBy": "64f76ceb1ed276af6a0074d0",
        "modifiedAt": 1694946900000,
        "modifiedBy": "system",
        "priority": {
            "key": "p_001",
            "value": "Low",
            "description": "Low",
            "status": "active",
            "priorityLevel": 1,
            "displayOrder": 1
        },
        "status": "active",
        "properties": {
            "creationSource": "user",
            "tentativeStartDateTimestamp": {
                "hour": 11,
                "minute": 33
            },
            "tentativeStartTime": 1694905200000,
            "moveDueDate": false,
            "helpURL": "",
            "type": "general",
            "thing_name": "Avengers",
            "taskNature": "taskNature_001",
            "timeLogMandatory": false,
            "tentativeTimeToClose": 0,
            "allowDelay": true,
            "thing_type": {
                "description": "Generic Self",
                "category": "self",
                "value": "Self",
                "key": "THO-100942"
            },
            "contentType": "general"
        },
        "resources": [],
        "name": "trigger branch test task without medium",
        "sId": 14,
        "hId": "T-14",
        "tags": {
            "searchTags": []
        },
        "delayedAt": 1695078557000
    },
    type: TriggerStrategy.POLLING,
    onEnable: async ({auth, store, propsValue}) => {
        await pollingHelper.onEnable(itemPolling, {
            auth, store, propsValue
        })
    },
    onDisable: async ({auth, store, propsValue}) => {
        await pollingHelper.onDisable(itemPolling, {
            auth, store, propsValue
        })
    },
    run: async ({auth, store, propsValue}) => {
        return await pollingHelper.poll(itemPolling, {
            auth, store, propsValue
        })
    }
})
