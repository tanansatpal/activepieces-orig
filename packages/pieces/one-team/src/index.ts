import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

import {createTask} from "./lib/actions/create-task";
import {taskItemCreatedTrigger} from "./lib/triggers/task-created-trigger";

export const oneTeamAuth = PieceAuth.OAuth2({
    authUrl: "https://keycloak.1team.ai/auth/realms/1team-dev/protocol/openid-connect/auth",
    tokenUrl: "https://keycloak.1team.ai/auth/realms/1team-dev/protocol/openid-connect/token",
    required: true,
    scope: ['openid'],
});

export const oneTeam = createPiece({
    displayName: "One-team",
    auth: oneTeamAuth,
    minimumSupportedRelease: '0.8.0',
    logoUrl: "https://1team.ai/wp-content/uploads/2022/05/FAVICON.png",
    authors: [],
    actions: [createTask],
    triggers: [taskItemCreatedTrigger],
});
