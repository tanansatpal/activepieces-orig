import {createAction, OAuth2PropertyValue, Property} from "@activepieces/pieces-framework";
import {AuthenticationType, httpClient, HttpMethod} from "@activepieces/pieces-common";
import {oneTeamCommon} from "../common/common";
import {oneTeamAuth} from "../../index";

export const createTask = createAction({
    name: 'create_task', // Must be a unique across the piece, this shouldn't be changed.
    auth: oneTeamAuth,
    displayName: 'Create Task',
    description: 'Create task on 1team',
    props: {
        workspace_id: oneTeamCommon.workspace_id,
        summary: Property.ShortText({
            displayName: 'Task summary',
            description: undefined,
            required: true,
        }),
        priority: Property.ShortText({
            displayName: 'Priority',
            description: undefined,
            required: true,
        }),
        thingId: Property.ShortText({
            displayName: 'Thing Id',
            description: undefined,
            required: true,
        }),
        owner: Property.ShortText({
            displayName: 'Owner',
            description: undefined,
            required: true,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: undefined,
            required: true,
        }),
    },
    async run(context) {
        const savedParams = context.propsValue['workspace_id'];
        const authProp: OAuth2PropertyValue = context.auth as OAuth2PropertyValue;
        const dueDate = new Date(context.propsValue['dueDate']);
        const dueDateObject = {
            year: dueDate.getFullYear(),
            month: dueDate.getMonth() + 1,
            day: dueDate.getDate()
        }
        const createTaskResponse = await httpClient.sendRequest<string[]>({
            method: HttpMethod.POST,
            url: `${oneTeamCommon.baseUrl}/wot/assignment/adhoc`,
            body: {
                "_id": null,
                "name": context.propsValue['summary'],
                "description": "",
                "thingId": context.propsValue['thingId'],
                "performer": context.propsValue['owner'],
                "performers": [],
                "dueDateTime": dueDateObject,
                "properties": {
                    "type": "general",
                    "contentType": "general",
                    "creationSource": "user",
                    "allowDelay": true,
                    "tentativeTimeToClose": 0,
                    "tentativeStartTime": new Date().getTime(),
                    "tentativeStartDateTimestamp": {"hour": new Date().getHours(), "minute": new Date().getMinutes()},
                    "timeLogMandatory": false,
                    "moveDueDate": false,
                    "helpURL": ""
                },
                "priority": oneTeamCommon.getPriorityObject(context.propsValue['priority']),
                "resources": [],
                "timeModel": {"hour": 23, "minute": 59},
                "tags": {"searchTags": []},
                "duration": 1,
                "owner": context.propsValue['owner'],
                "dueTime": dueDate.getTime(),
                "startTime": new Date().getTime()
            },
            headers: {
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
        });
        return createTaskResponse.body;
    },
});
