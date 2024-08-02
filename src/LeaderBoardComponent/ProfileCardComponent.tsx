import { UserData } from "../common/interface";
import { NameAndMintLinkComponent } from "./NameAndMintLinkComponent";
import { StatsCardComponent } from "./StatsCardComponent";

interface ProfileCardProps {
	user: UserData;
}

export const ProfileCardComponent = ({ user }: ProfileCardProps) => {
	// TODO : Update once we have API.
	const rank = "251";
	const streak = "21";

	return (
		<div className="w-[367px] h-[142px] bg-white rounded-lg p-4 flex flex-col gap-4">
			<NameAndMintLinkComponent
				avatar={{ src: user.pfp, alt: "Profile" }}
				slug={user.slug}
				userName={user.name}
			/>
			<StatsCardComponent
				kleoPoints={user.profile_metadata["kleo_points"]}
				rank={rank}
				streak={streak}
			/>
		</div>
	);
};
