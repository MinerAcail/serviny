import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "../ui/button";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  MapPin,
  Plus,
  Search,
  User,
  X,
  Trash2,
} from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/middleware/context/authContext";
import { getImageUrl } from "../global/formatPrice";

export const LIST_SERVICES = gql`
  query listServices($search: String, $limit: Int, $offset: Int) {
    listServices(search: $search, limit: $limit, offset: $offset) {
      id
      name
      type
      profession
      dpfile
      location
      subDomain
    }
  }
`;

export const PROFILES_MUTATION = gql`
  mutation Profiles($profileId: String!, $removeProfileId: String) {
    profiles(profileId: $profileId, removeProfileId: $removeProfileId) {
      id
      type
      profileIds
    }
  }
`;

export const GET_PROFILES_QUERY = gql`
  query GetProfiles {
    getProfiles {
      id
      type
      profileIds
    }
  }
`;

export interface Profile {
  id: string;
  name: string;
  subDomain: string;
  avatar?: string;
  type?: string;
  profession?: string[] | string;
  location?: string;
  lastUsed?: Date;
}

export interface UserProfileData {
  id: string;
  type: string;
  profileIds: string[];
}

export function useProfileUpdate(profileId: string | null | undefined) {
  const [updateProfileMutation, { loading: updating, error: updateError }] =
    useMutation(PROFILES_MUTATION);

  const {
    data: getProfileData,
    loading: fetching,
    error: fetchError,
    refetch,
  } = useQuery(GET_PROFILES_QUERY);

  const loading = updating || fetching;
  const error = updateError || fetchError;
  const profile = getProfileData?.getProfiles ?? null;
  const firstProfileId = profile?.profileIds?.[0] ?? null;

  // Track the last profileId we triggered
  const lastTriggeredIdRef = useRef<string | null>(null);

  // Trigger mutation for adding/switching profiles
  const triggerUpdate = useCallback(
    async (newProfileId: string) => {
      try {
        const res = await updateProfileMutation({
          variables: { profileId: newProfileId },
        });
        await refetch();
        lastTriggeredIdRef.current = newProfileId;
        return res.data?.profiles ?? null;
      } catch (err) {
        console.error("Profile update failed:", err);
        return null;
      }
    },
    [updateProfileMutation, refetch]
  );

  // Trigger mutation for removing profiles
  const triggerRemove = useCallback(
    async (removeProfileId: string) => {
      try {
        // Use the first available profile as the new active profile, or empty string if removing the last one
        const remainingProfiles =
          profile?.profileIds?.filter((id) => id !== removeProfileId) || [];
        const newActiveProfileId =
          remainingProfiles.length > 0 ? remainingProfiles[0] : "";

        const res = await updateProfileMutation({
          variables: {
            profileId: newActiveProfileId,
            removeProfileId: removeProfileId,
          },
        });
        await refetch();
        return res.data?.profiles ?? null;
      } catch (err) {
        console.error("Profile removal failed:", err);
        return null;
      }
    },
    [updateProfileMutation, refetch, profile?.profileIds]
  );

  // Automatically trigger if firstProfileId !== profileId
  useEffect(() => {
    if (
      profileId &&
      profileId !== firstProfileId &&
      profileId !== lastTriggeredIdRef.current
    ) {
      triggerUpdate(profileId);
    }
  }, [profileId, firstProfileId, triggerUpdate]);

  return {
    triggerUpdate,
    triggerRemove,
    profile,
    firstProfileId,
    loading,
    error,
    refetch,
  };
}

export function useProfiles(userProfileData: any) {
  // Fetch all available profiles
  const { data: servicesData, loading: servicesLoading } = useQuery(
    LIST_SERVICES,
    {
      variables: { limit: 100, offset: 0 },
    }
  );

  const allProfiles: Profile[] = useMemo(() => {
    if (!servicesData?.listServices) return [];

    return servicesData.listServices.map((service: any) => ({
      id: service.id,
      name: service.name,
      subDomain: service.subDomain,
      avatar: service.dpfile,
      type: service.type,
      profession: service.profession,
      // Truncate location if it's too long
      location:
        service.location && service.location.length > 30
          ? service.location.slice(0, 10) + "..."
          : service.location,
    }));
  }, [servicesData]);

  // Get saved profiles based on user's profileIds
  const savedProfiles = useMemo(() => {
    if (!userProfileData?.profileIds || !allProfiles.length) return [];

    return userProfileData.profileIds
      .map((id: string) => allProfiles.find((profile) => profile.id === id))
      .filter(Boolean)
      .map((profile: Profile, index: number) => ({
        ...profile,
        lastUsed:
          index === 0
            ? new Date()
            : new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      }));
  }, [userProfileData?.profileIds, allProfiles]);

  // Get available profiles (not saved yet)
  const availableProfiles = useMemo(() => {
    if (!allProfiles.length || !userProfileData?.profileIds) return allProfiles;

    return allProfiles.filter(
      (profile) => !userProfileData.profileIds.includes(profile.id)
    );
  }, [allProfiles, userProfileData?.profileIds]);

  return {
    savedProfiles,
    availableProfiles,
    loading: servicesLoading,
    currentProfile: savedProfiles[0] || null,
  };
}

// Helper function to format profession display
const formatProfessionDisplay = (profession: string[] | string | undefined): string => {
  if (!profession) return '';
  
  if (Array.isArray(profession)) {
    return profession.slice(0, 1).join(', ');
  }
  
  return profession;
};

// Helper function to check if profession matches search
const professionMatches = (profession: string[] | string | undefined, query: string): boolean => {
  if (!profession) return false;
  
  const lowerQuery = query.toLowerCase();
  
  if (Array.isArray(profession)) {
    return profession.some(p => p.toLowerCase().includes(lowerQuery));
  }
  
  return profession.toLowerCase().includes(lowerQuery);
};

interface BrowseProfilesDialogProps {
  availableProfiles: Profile[];
  savedProfiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrowseProfilesDialog({
  availableProfiles,
  savedProfiles,
  onSelectProfile,
  loading = false,
  open,
  onOpenChange,
}: BrowseProfilesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredProfiles = useMemo(() => {
    let filtered = availableProfiles;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          professionMatches(profile.profession, query) ||
          profile.location?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((profile) => profile.type === selectedType);
    }

    return filtered;
  }, [availableProfiles, searchQuery, selectedType]);

  const profileTypes = useMemo(() => {
    const types = new Set(availableProfiles.map((p) => p.type).filter(Boolean));
    return Array.from(types);
  }, [availableProfiles]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedType("all");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] h-[90vh] p-0 bg-white/90 backdrop-blur-3xl border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/30 pointer-events-none" />

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 border-b border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Browse Profiles
            </DialogTitle>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, profession, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/70 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            {profileTypes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("all")}
                  className="whitespace-nowrap"
                >
                  All
                </Button>
                {profileTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="whitespace-nowrap capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Results */}
        <div className="relative flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                    <User className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-base font-semibold mb-2">
                    {searchQuery
                      ? "No profiles found"
                      : "No available profiles"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "All profiles have been added"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => onSelectProfile(profile)}
                      className="w-full p-5 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl hover:bg-white hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-200 shadow-md">
                          <AvatarImage
                            src={getImageUrl(profile.avatar) || "/placeholder.svg"}
                          />
                          <AvatarFallback className="bg-blue-600 text-white font-bold border border-blue-300">
                            {profile.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate text-base">
                              {profile.name}
                            </p>
                            {profile.type && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                                {profile.type}
                              </span>
                            )}
                          </div>

                          {profile.profession && (
                            <p className="text-sm text-gray-600 truncate font-medium mb-1">
                              {formatProfessionDisplay(profile.profession)}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{profile.subDomain}.winnemart.com</span>
                           
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">

                           {profile.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{profile.location}</span>
                              </div>
                            )}
                        </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProfileSwitcherProps {
  currentProfile?: Profile;
  savedProfiles: Profile[];
  availableProfiles: Profile[];
  onProfileSwitch: (profile: Profile) => void;
  onAddProfile: (profile: Profile) => void;
  onRemoveProfile: (profile: Profile) => void;
  loading?: boolean;
}

export function ProfileSwitcher({
  currentProfile,
  savedProfiles,
  availableProfiles,
  onProfileSwitch,
  onAddProfile,
  onRemoveProfile,
  loading = false,
}: ProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const { firstProfileId } = useProfileUpdate(null);
  const { isAuthenticated } = useAuth();
  
  const handleProfileSwitch = (profile: Profile) => {
    onProfileSwitch(profile);
    setIsOpen(false);
    // when switching profiles, reload the page to apply changes
    window.location.reload();
  };

  const handleAddProfile = async (profile: Profile) => {
    try {
      await onAddProfile(profile);
      if (profile.id) {
        localStorage.setItem("serviceId", profile.id);
      }
      setShowBrowse(false);
      setIsOpen(false);
      // when switching profiles, reload the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error("Failed to add profile:", error);
    }
  };

  const handleRemoveProfile = async (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent profile switch when clicking remove
    try {
      await onRemoveProfile(profile);
    } catch (error) {
      console.error("Failed to remove profile:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto p-0 bg-transparent hover:bg-transparent group"
            disabled={loading}
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg hover:bg-white hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <Avatar className="h-9 w-9 ring-2 ring-blue-200 shadow-md">
                <AvatarImage
                  src={getImageUrl(currentProfile?.avatar) || "/placeholder.svg"}
                />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold border border-blue-300">
                  {currentProfile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {loading
                    ? "Loading..."
                    : currentProfile?.name
                    ? currentProfile.name
                    : firstProfileId === null
                    ? "Add Service"
                    : "Switch Service"}
                </span>
                {currentProfile?.subDomain && (
                  <span className="text-xs text-gray-600 truncate font-medium">
                    {currentProfile.subDomain}.winnemart.com
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-2 group-hover:text-gray-700 transition-colors" />
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md h-[85vh] p-0 bg-white/90 backdrop-blur-3xl border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/30 pointer-events-none" />

          {/* Fixed Header */}
          <div className="relative p-8 pb-6 flex-shrink-0 border-b border-gray-200">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                Switch Profile
              </DialogTitle>
            </DialogHeader>

            {/* Add New Profile Button */}
            <Button
              onClick={() => setShowBrowse(true)}
              disabled={loading || availableProfiles.length === 0}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5 mr-3" />
              Add New Profile
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="relative flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-8 py-6">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Your Profiles
                </h3>

                <div className="space-y-3 pb-4">
                  {savedProfiles.map((profile) => (
                    <div key={profile.id} className="relative group">
                      <button
                        onClick={() => handleProfileSwitch(profile)}
                        disabled={loading}
                        className="w-full p-5 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl hover:bg-white hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 ring-2 ring-blue-200 shadow-md">
                            <AvatarImage
                              src={getImageUrl(profile.avatar) || "/placeholder.svg"}
                            />
                            <AvatarFallback className="bg-blue-600 text-white font-bold border border-blue-300">
                              {profile.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-semibold text-gray-900 truncate text-base">
                                {profile.name}
                              </p>
                              {currentProfile?.id === profile.id && (
                                <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate font-medium">
                              {profile.subDomain}.winnemart.com
                            </p>
                            {profile.profession && (
                              <p className="text-xs text-gray-500 truncate font-medium">
                                {formatProfessionDisplay(profile.profession)}
                              </p>
                            )}
                            {profile.lastUsed && (
                              <p className="text-xs text-gray-400 mt-2 font-medium">
                                Last used{" "}
                                {profile.lastUsed.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Remove Button - Only show if more than one profile */}
                      {savedProfiles.length > 1 && (
                        <button
                          onClick={(e) => handleRemoveProfile(profile, e)}
                          disabled={loading}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-red-600 disabled:cursor-not-allowed"
                          title="Remove profile"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {savedProfiles.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                      <User className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-gray-700 text-base font-semibold mb-2">
                      No saved profiles yet
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Add your first profile to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Browse Profiles Dialog */}
      <BrowseProfilesDialog
        availableProfiles={availableProfiles}
        savedProfiles={savedProfiles}
        onSelectProfile={handleAddProfile}
        loading={loading}
        open={showBrowse}
        onOpenChange={setShowBrowse}
      />
    </>
  );
}

interface ProfileSwitcherContainerProps {
  initialProfileId?: string;
}

export function ProfileSwitcherContainer({
  initialProfileId,
}: ProfileSwitcherContainerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    initialProfileId || null
  );

  const {
    triggerUpdate,
    triggerRemove,
    profile: userProfileData,
    loading: profileLoading,
    error,
  } = useProfileUpdate(selectedProfileId);

  const {
    savedProfiles,
    availableProfiles,
    loading: profilesLoading,
    currentProfile,
  } = useProfiles(userProfileData);

  const handleProfileSwitch = async (profile: Profile) => {
    setSelectedProfileId(profile.id);
    await triggerUpdate(profile.id);
  };

  const handleAddProfile = async (profile: Profile) => {
    await triggerUpdate(profile.id);
    setSelectedProfileId(profile.id);
  };

  const handleRemoveProfile = async (profile: Profile) => {
    await triggerRemove(profile.id);
    // If we removed the current profile, update selectedProfileId to the new first profile
    if (profile.id === selectedProfileId) {
      const remainingProfiles = savedProfiles.filter(
        (p) => p.id !== profile.id
      );
      const newCurrentProfile = remainingProfiles[0];
      setSelectedProfileId(newCurrentProfile?.id || null);
    }
  };

  if (error) {
    console.error("Profile switcher error:", error);
  }

  return (
    <ProfileSwitcher
      currentProfile={currentProfile}
      savedProfiles={savedProfiles}
      availableProfiles={availableProfiles}
      onProfileSwitch={handleProfileSwitch}
      onAddProfile={handleAddProfile}
      onRemoveProfile={handleRemoveProfile}
      loading={profileLoading || profilesLoading}
    />
  );
}