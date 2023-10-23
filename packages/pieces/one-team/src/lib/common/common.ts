import {OAuth2PropertyValue, Property} from "@activepieces/pieces-framework";
import {
    AuthenticationType,
    httpClient, HttpHeaders,
    HttpMethod
} from "@activepieces/pieces-common";

export interface KeycloakProfile {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    emailVerified?: boolean;
    totp?: boolean;
    createdTimestamp?: number;
}

export interface FileType {
    createdAt: Date;
    createdBy: string;
    fileExtension: string;
    fileName: string;
    filePath: string;
    fileUUID: string;
    resourceType: string;
    status: string;
    _id: string;
}

export interface IAMUser {
    avatar: FileType;
    countryCode: string;
    createdAt: Date;
    createdBy: string;
    customFields: Record<string, any>;
    email: string;
    firstName: string;
    initials: string;
    lastName: string;
    modifiedAt: Date;
    modifiedBy: string;
    phone: string;
    properties: Record<string, any>;
    referenceId: string;
    status: string;
    _id: string;
}

export const oneTeamCommon: any = {
    baseUrl: "https://jovt87luqa.execute-api.ap-south-1.amazonaws.com/dev/api",
    keycloakUrl: "https://keycloak.1team.ai/auth/realms/1team-dev",
    workspace_id: Property.Dropdown({
        refreshers: [],
        displayName: 'Workspace Id',
        description: undefined,
        required: true,
        options: async ({auth}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const {iamUser, user} = await oneTeamCommon.getUsers(auth);

            const workSpaces = (await httpClient.sendRequest<{ data: { name: string, wot_workspaceId: string }[] }>({
                method: HttpMethod.POST,
                url: `${oneTeamCommon.baseUrl}/organization/search`,
                headers: {
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
                            "name": "and",
                            "args": [
                                {
                                    "funct": {
                                        "name": "equal",
                                        "args": [
                                            {
                                                "name": "createdBy",
                                                "type": "Field"
                                            },
                                            {
                                                "name": iamUser._id,
                                                "type": "Constant"
                                            }
                                        ]
                                    }
                                },
                                {
                                    "funct": {
                                        "name": "equal",
                                        "args": [
                                            {
                                                "name": "status",
                                                "type": "Field"
                                            },
                                            {
                                                "name": "active",
                                                "type": "Constant"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            })).body.data;
            return {
                disabled: false,
                options: workSpaces.map((ws: any) => {
                    return {
                        label: ws.name,
                        value: {
                            organisationId: ws._id,
                            workspaceId: ws.wot_workspaceId,
                            iamUserId: iamUser._id,
                            userId: user._id,
                            wotUserId: user.wot_userId
                        }
                    }
                })
            }
        }
    }),
    thing_type: Property.Dropdown({
        refreshers: ['workspace_id'],
        displayName: 'Thing Type',
        description: undefined,
        required: true,
        options: async ({auth, workspace_id}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            if (!workspace_id) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select a workspace"
                }
            }
            const excludeThingTypes = ['boards', 'todo', 'bookmark', 'mom'];
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const workspaceData = workspace_id as any;
            const orgData = (await httpClient.sendRequest<{ 'thing-types': any }>({
                method: HttpMethod.GET,
                url: `https://dev.1team.ai/1team-assets/org-assets/${workspaceData.organisationId}/web/org-web.json`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp.access_token
                },
                body: {}
            })).body;
            const thingTypes = orgData['thing-types']
            return {
                disabled: false,
                options: thingTypes.filter((t: any) => !excludeThingTypes.includes(t.category)).map((thing: any) => {
                    return {
                        label: thing.value,
                        value: thing.key
                    }
                })
            }
        }
    }),
    thing_id: Property.Dropdown({
        refreshers: ['thing_type'],
        displayName: 'Thing',
        description: undefined,
        required: true,
        options: async ({auth, thing_type, workspace_id}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            if (!workspace_id) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select a workspace"
                }
            }
            if (!thing_type) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select a thing type"
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const workspaceData = workspace_id as any;
            const things = (await httpClient.sendRequest<{ data: { name: string, _id: string }[] }>({
                method: HttpMethod.POST,
                url: `${oneTeamCommon.baseUrl}/wot/module/search`,
                headers: {
                    'Wot-Workspace-Id': workspaceData.workspaceId,
                    'Wot-User-Id': workspaceData.wotUserId,
                    'Userid': workspaceData.userId,
                    'Organizationid': workspaceData.organisationId,
                    'Iamuserid': workspaceData.iamUserId,
                    Clientid: '634e809a1ac94f41fc07a832',
                    Apikey: 'b2w16qhe0p',
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                },
                body: {
                    filter: {
                        "funct": {
                            "name": "and",
                            "args": [
                                {
                                    "funct": {
                                        "name": "equal",
                                        "args": [
                                            {
                                                "name": "status",
                                                "type": "Field"
                                            },
                                            {
                                                "name": "active",
                                                "type": "Constant"
                                            }
                                        ]
                                    }
                                },
                                {
                                    "funct": {
                                        "name": "equal",
                                        "args": [
                                            {
                                                "name": "type.key",
                                                "type": "Field"
                                            },
                                            {
                                                "name": thing_type,
                                                "type": "Constant"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    module: 'THING'
                }
            })).body.data;

            return {
                disabled: false,
                options: things.map((thing: any) => {
                    return {
                        label: thing.name,
                        value: thing._id
                    }
                })
            }
        }
    }),
    owner: Property.Dropdown({
        refreshers: ['workspace_id'],
        displayName: 'Owner',
        description: undefined,
        required: true,
        options: async ({auth, workspace_id}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            if (!workspace_id) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select a workspace"
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const workspaceData = workspace_id as any;
            const users = (await httpClient.sendRequest<{ data: { name: string, wot_userId: string }[] }>({
                method: HttpMethod.POST,
                url: `${oneTeamCommon.baseUrl}/wot/module/search`,
                headers: {
                    'Wot-Workspace-Id': workspaceData.workspaceId,
                    'Wot-User-Id': workspaceData.wotUserId,
                    'Userid': workspaceData.userId,
                    'Organizationid': workspaceData.organisationId,
                    'Iamuserid': workspaceData.iamUserId,
                    Clientid: '634e809a1ac94f41fc07a832',
                    Apikey: 'b2w16qhe0p',
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                },
                body: {
                    "filter": {
                        "funct": {
                            "name": "and", "args": [{
                                "funct": {
                                    "name": "equal", "args": [{"name": "status", "type": "Field"}, {
                                        "name": "active", "type": "Constant"
                                    }]
                                }
                            }]
                        }
                    },"module": "USER"
                }
            })).body.data;
            return {
                disabled: false,
                options: users.map((user: any) => {
                    return {
                        label: user.name,
                        value: user._id
                    }
                })
            }
        }
    }),
    getPriorityObject(priority: string) {
        const priorities = [
            {
                "key": "p_001",
                "value": "Low",
                "description": "Low",
                "status": "active",
                "priorityLevel": 1,
                "displayOrder": 1
            },
            {
                "key": "p_002",
                "value": "Medium",
                "description": "Medium",
                "status": "active",
                "priorityLevel": 3,
                "displayOrder": 2
            },
            {
                "key": "p_003",
                "value": "High",
                "description": "High",
                "status": "active",
                "priorityLevel": 5,
                "displayOrder": 3
            },
            {
                "key": "p_004",
                "value": "Critical",
                "description": "Critical",
                "status": "active",
                "priorityLevel": 10,
                "displayOrder": 4
            }
        ]
        return priorities.find(p => p.value === priority);
    },
    async getUsers(auth: OAuth2PropertyValue): Promise<{ iamUser: IAMUser, user: any }> {
        const keycloakUser: KeycloakProfile = (await httpClient.sendRequest<KeycloakProfile>({
            method: HttpMethod.GET,
            url: `${oneTeamCommon.keycloakUrl}/account`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token
            },
            body: {}
        })).body;

        const iamUser = (await httpClient.sendRequest<{ data: IAMUser[] }>({
            method: HttpMethod.POST,
            url: `${oneTeamCommon.baseUrl}/IAMUser/search-by-referenceId`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token
            },
            headers: {
                Clientid: '634e809a1ac94f41fc07a832',
                Apikey: 'b2w16qhe0p',
            },
            body: {referenceId: keycloakUser.id}
        })).body.data[0];
        let user;
        const users = (await httpClient.sendRequest<IAMUser[]>({
            method: HttpMethod.POST,
            url: `${oneTeamCommon.baseUrl}/users/search`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token
            },
            headers: {
                Clientid: '634e809a1ac94f41fc07a832',
                Apikey: 'b2w16qhe0p',
            },
            body: {iamUserId: iamUser._id, keycloakId: keycloakUser.id}
        })).body;

        if (users.length) {
            user = users[0];
        }
        return {iamUser, user};
    }
}
