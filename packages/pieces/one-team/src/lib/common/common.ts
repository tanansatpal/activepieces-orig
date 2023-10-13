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
