// Simple file-based DAO - no database required
import {
    FileUserLevelDAO,
    FileScheduledMessageDAO,
    FileStatsChannelDAO,
    FileLevelRoleDAO,
    UserLevel,
    ScheduledMessage,
    StatsChannel,
    LevelRole
} from './dao-file';

// Export with expected names
export const UserLevelDAO = FileUserLevelDAO;
export const ScheduledMessageDAO = FileScheduledMessageDAO;
export const StatsChannelDAO = FileStatsChannelDAO;
export const LevelRoleDAO = FileLevelRoleDAO;

export type { UserLevel, ScheduledMessage, StatsChannel, LevelRole };
