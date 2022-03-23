import { Channel } from "@Services/orm/models"

interface IAllKitBaseUsage {
	/**
	 * @returns
	 * Promise containing usage rates for all kit bases
	 *
	 */
	(): Promise<
		Array<{
			_id: string
			baseCount: number
			channelCount: number
			ratio: number
		}>
	>
}

/**
 * SERVER SIDE ONLY!
 *
 * Get the rate at which all Kit Bases are featured by channels.
 */
export const allKitBaseFeaturedRateQuery: IAllKitBaseUsage = async () => {
	const result = await Channel.aggregate([
		{
			$facet: {
				count: [
					{
						$count: "channelCount"
					}
				],
				kitCounts: [
					{
						$unwind: "$kits"
					},
					{
						$match: {
							"kits.userData.featured": true
						}
					},
					{
						$group: {
							_id: "$kits.baseId",
							matches: {
								$addToSet: {
									base: "$kits.baseId",
									channelId: "$_id"
								}
							}
						}
					},
					{
						$project: {
							_id: "$_id",
							baseCount: {
								$size: "$matches"
							}
						}
					}
				]
			}
		},
		{
			$addFields: {
				count: {
					$arrayElemAt: ["$count.channelCount", 0]
				}
			}
		},
		{
			$project: {
				kitCounts: {
					$map: {
						input: "$kitCounts",
						as: "item",
						in: {
							$mergeObjects: [
								"$$item",
								{
									channelCount: "$count",
									ratio: {
										$divide: ["$$item.baseCount", "$count"]
									}
								}
							]
						}
					}
				}
			}
		}
	])

	return result[0].kitCounts
}