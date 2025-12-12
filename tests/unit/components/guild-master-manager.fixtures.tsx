import { render } from "@testing-library/react";
import GuildMasterManager from "@/components/admin/guild-master-manager";
import { supabase } from "@/lib/supabase";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

export const mockOnFamilyMemberUpdate = jest.fn(() => jest.fn());

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
  }),
}));

export const mockProfile = {
  id: "user-1",
  family_id: "family-123",
  role: "GUILD_MASTER",
  name: "Alice",
};

export const mockUser = {
  id: "user-1",
};

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(() => ({
    profile: mockProfile,
    user: mockUser,
  })),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

export const mockMembers = [
  {
    id: "user-1",
    name: "Alice",
    role: "GUILD_MASTER",
    family_id: "family-123",
    characters: {
      name: "Alice the Knight",
      level: 5,
    },
  },
  {
    id: "user-2",
    name: "Bob",
    role: "GUILD_MASTER",
    family_id: "family-123",
    characters: {
      name: "Bob the Mage",
      level: 3,
    },
  },
  {
    id: "user-3",
    name: "Charlie",
    role: "HERO",
    family_id: "family-123",
    characters: {
      name: "Charlie the Rogue",
      level: 4,
    },
  },
];

export const setupSupabaseList = (members = mockMembers) => {
  const mockOrder2 = jest.fn().mockResolvedValue({
    data: members,
    error: null,
  });
  const mockOrder1 = jest.fn().mockReturnValue({
    order: mockOrder2,
  });
  const mockEq = jest.fn().mockReturnValue({
    order: mockOrder1,
  });
  const mockSelect = jest.fn().mockReturnValue({
    eq: mockEq,
  });
  (supabase.from as jest.Mock).mockReturnValue({
    select: mockSelect,
  });
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: {
        access_token: "mock-token",
      },
    },
  });
  return { mockOrder1, mockOrder2 };
};

export const renderGuildMasterManager = () => render(<GuildMasterManager />);

export const resetGuildMasterMocks = () => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
};
