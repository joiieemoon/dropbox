import PageMeta from "../../components/common/pagemeta/PageMeta";
import UserMetaCard from "./components/user-metacard";
import UserInfoCard from "./components/user-infocard";

import { useUserProfile } from "../../api/hooks";
import { Spinner } from "../../components/common/spinner";

export default function UserProfiles() {
  const { isLoading, error } = useUserProfile(true);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="User Profile | TrackSend"
          description="Manage your profile"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading profile...</div>
          <Spinner size="xl" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="User Profile | TrackSend"
          description="Manage your profile"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Failed to load profile</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="User Profile | TrackSend"
        description="Manage your profile"
      />
      <div className="space-y-6">
        <UserMetaCard />
        <UserInfoCard />
        {/* <UserAddressCard /> */}
      </div>
    </>
  );
}
