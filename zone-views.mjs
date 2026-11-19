/**
 * R2 station observation cameras, in the same plan coordinates as arch.mjs.
 * look is a horizontal bearing, not a destination. pitch is radians; negative
 * looks down. The renderer retains its 1.62 m eye height and 65 degree FOV.
 *
 * Sources checked: arch.mjs walls/doors/columns; all props.mjs footprints;
 * R2 reference/detail crops; finish references 03/05/07/08/12/17/21. Finish
 * images inform framing only: they do not authorize new openings or furniture.
 *
 * These are discrete observation points, NOT extra route vertices. In
 * particular 15/17/18/21 must never be interpolated straight from the route:
 * - 15: y=727 is currently a modeled wall. Observe inside C4 independently.
 * - 17/18: y=621 is a modeled wall. The old [333,605] eye also overlapped
 *   bed 2's footprint. The replacement eye is beside, not on, the bed.
 *   The open west end at x=267 does not justify a straight street-to-bed move.
 * - 21: route point [636,600] is in the narrow west approach, screened from
 *   the main plaza by x=661. The plaza eye is a separate, labeled viewpoint.
 * No architecture, route, opening, or furniture location is changed here.
 * Café 14 is deliberately absent; cafe-finish.mjs owns its interior sequence.
 *
 * Per-station audit / framing intent:
 * 01: Original exterior stop; faces the confirmed electric entrance, not the
 *     unmodeled drop-off area. Clear of plaza fixture [690,882].
 * 02: Within the welcome aisle, looks south along the finishes and lights.
 *     The plan welcome display is currently placed at x=557, behind the
 *     modeled x=560 wall. Do not aim through that wall or the [564,885]
 *     column and pretend the screen is visible; flag the mismatch instead.
 * 03: Lobby eye north of reception, framing the counter at a comfortable
 *     distance. Never within [594,1024.5] or the chairs behind it. The final
 *     eye/bearing are the root's visual-QA adjustment, retained unchanged.
 * 04: West-facing corridor view includes the main-hall glass opening at
 *     x=501..529,y=1083; stays north of the partition and clear of door leaves.
 * 05: East hall aisle looks diagonally toward the lounge/display cluster;
 *     stays west of the fire-control boundary x=565 and off all sofa/table
 *     footprints. The thin exhibit divider at x=462.5 is behind the eye.
 * 06: West hall aisle faces the north exhibits, separately from 05's lounge.
 *     Clear of kiosk [347,1131], product table [433,1179.5], and columns.
 * 07: South of the shop counter row, diagonal view into the retail shelves.
 *     Does not occupy a checkout footprint or cross the x=332 partition.
 * 08: Same open circulation band, turned south into the warehouse rack
 *     aisles, not another identical retail view. Racks remain in place.
 * 09: West circulation strip faces the rider/customer and handover counters;
 *     clear of the west wall/shelves and southwest work desks.
 * 10: At the corridor bend, looks toward the confirmed production observation
 *     window x=167..227,y=1045. Does not treat the sill as a full glass wall.
 * 11: West end of the production visitor aisle, close view of the line head.
 * 12: Center visitor aisle, oblique long view between the north machines and
 *     south conveyor; eye remains north of y=964.5 machinery.
 * 13: Eastern visitor aisle, a different diagonal view of the line tail;
 *     neither camera nor target is inside the y=842 exit wall.
 * 15: C4 interior eye between the equipment rows, east of the kiosk sightline,
 *     faces the south display. Clear of column [361,783] and all kiosks.
 * 16: Slightly west of the original turn point, faces into the open west end
 *     of the hotel reception set. Avoids the y=650 wall endpoint at x=282.
 * 17: Guestroom eye in the southeast clear strip, views beds obliquely; south
 *     wall is behind. Chair [341.5,601.5] and both beds are outside the eye.
 * 18: B2 southeast clear strip, faces the apartment counter/entry fixtures;
 *     avoids kiosk [458,609.5] and desk footprints to the west.
 * 19: Street junction looks west along the clear y=621..650 street, rather
 *     than aiming directly into either closed hotel facade.
 * 20: Passage eye faces east through the confirmed x=615,y=586..614 opening;
 *     stays north of the y=621 service-room wall.
 * 21: Confirmed outdoor plaza, southeast of the existing installation at
 *     [690,646.5]. Faces its length and the west facade, not an invented vista.
 * 22: Elevator front room, north-facing toward the elevator-side boundary;
 *     does not claim to enter a lift or show the actual third floor.
 *
 * Validation: 21 finite, distinct-eye/target records; no 14 override. Checked
 * wall/window/glass footprints, jambs, modeled open double leaves, structural
 * columns, every props footprint (extra 0.05 m margin), and 4,308 generated
 * below-head-height boxes from zone-surfaces/zone-props/zone-light. Smallest
 * eye-to-obstacle distance is approximately 0.594 m at 17's south wall trim.
 * This is a static camera clearance audit, not accessibility certification
 * or validation of the pre-existing continuous route. Integrated screenshots
 * remain the authority for composition and any later geometry changes.
 */
export const zoneViews = {
  1: {eye:[727,862], look:[615,862], pitch:-0.025, hint:'入口前庭观察点：向西看电动玻璃入口及迎宾轴线。'},
  2: {eye:[592,868], look:[588,930], pitch:-0.025, hint:'迎宾通道观察点：沿通道看侧墙饰面、铺地与线性顶灯。'},
  3: {eye:[601,969], look:[599,1017], pitch:-0.015, hint:'门厅观察点：面向接待台，查看木饰面、台面与集合空间。'},
  4: {eye:[560,1064], look:[514,1083], pitch:-0.025, hint:'展廊观察点：斜看主展厅玻璃入口，保留两侧墙体与门洞关系。'},
  5: {eye:[514,1146], look:[547,1182], pitch:-0.065, hint:'主展厅东侧观察点：看休憩座席、展示台与展墙的组合。'},
  6: {eye:[406,1146], look:[382,1093], pitch:-0.035, hint:'主展厅西侧观察点：转向北侧展陈，查看展柜、重点照明及背景饰面。'},
  7: {eye:[293,1169], look:[244,1127], pitch:-0.045, hint:'店面观察点：从收银区南侧斜看零售货架与店面通道。'},
  8: {eye:[220,1169], look:[257,1238], pitch:-0.045, hint:'前置仓观察点：朝南看货架和备货区域，不与店面视角重复。'},
  9: {eye:[109,1169], look:[145,1200], pitch:-0.065, hint:'骑手与顾客区观察点：看交接台、暂存与作业区域。'},
  10: {eye:[109,1064], look:[197,1045], pitch:-0.005, hint:'走道展廊观察点：沿窗带看装配区，观察窗仍保留实体窗台。'},
  11: {eye:[109,933], look:[124,901], pitch:-0.090, hint:'线头观察点：近看起始工位及访客通道边界，设备外观为示意。'},
  12: {eye:[228,933], look:[390,949], pitch:-0.015, hint:'装配线观察点：沿中央参观通道看连续工位、输送线和顶灯。'},
  13: {eye:[401,933], look:[459,902], pitch:-0.055, hint:'线尾观察点：斜看末端工位与出口方向，保持访客通道净空。'},
  15: {eye:[345,778], look:[316,834], pitch:-0.060, hint:'表演区室内独立观察点：看南侧显示区及设备阵列；不是从街上穿墙进入。'},
  16: {eye:[276,658], look:[318,672], pitch:-0.050, hint:'回转区观察点：从酒店接待区西侧开口斜看室内，避开墙角。'},
  17: {eye:[346,612], look:[315,593], pitch:-0.150, hint:'酒店客房独立观察点：从床侧看床头、织物与灯光；不沿街穿墙移动。'},
  18: {eye:[445,610], look:[408,590], pitch:-0.090, hint:'楼栋布景室内独立观察点：看玄关与固定设施；不沿街穿墙移动。'},
  19: {eye:[490,635], look:[420,638], pitch:-0.010, hint:'街区小广场观察点：向西看街道纵深及两侧布景立面。'},
  20: {eye:[534,600], look:[615,600], pitch:-0.010, hint:'街门通道观察点：向东看既有门洞与景区广场入口。'},
  21: {eye:[730,690], look:[690,646], pitch:-0.045, hint:'景区广场独立观察点：从东南侧看现有装置、铺装与西侧立面。'},
  22: {eye:[731,351], look:[730,301], pitch:-0.015, hint:'电梯前室观察点：面向电梯侧边界，查看前厅饰面与导向。'}
};
