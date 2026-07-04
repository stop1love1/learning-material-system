/**
 * essay-answers.js — văn/đáp án mẫu KHỚP TỪNG ĐỀ tự luận, do soạn tay theo đúng
 * yêu cầu của mỗi đề (không phải văn gán ngẫu nhiên). Dùng bởi seed-demo-activity.js.
 *
 * QUESTION_ANSWERS: { [questionId]: [đáp án 1, đáp án 2, ...] } — cho 56 câu tự luận
 *   nằm trong các Phiếu quiz (viết câu so sánh/nhân hóa, mở/kết bài, đoạn 4-5 câu,
 *   dàn ý, và câu đọc hiểu có đáp án cố định).
 * EXERCISE_ESSAYS: { [exerciseId]: [bài văn 1, ...] } — bài văn hoàn chỉnh cho 16
 *   bài "Đề bài" tự luận (mỗi bài chọn một đề con trong danh sách của đề bài đó).
 */
'use strict';

const QUESTION_ANSWERS = {
  // ---- Phiếu 2 ----
  '6a465c220074fdef48a91186': [
    'Trước khi tham quan:\n- Thời gian, địa điểm: sáng chủ nhật tuần trước, lớp em đi tham quan Lăng Bác.\n- Cảnh vật, con người: trời trong xanh, mọi người ai cũng háo hức, xếp hàng ngay ngắn.\nKhi đến nơi tham quan:\n- Đầu tiên: chúng em nghe cô hướng dẫn viên giới thiệu về Bác.\n- Sau đó: cả lớp xếp hàng vào viếng Bác trong không khí trang nghiêm.\n- Tiếp theo: em được đi thăm Nhà sàn và ao cá của Bác.\n- Cuối cùng: chúng em chụp ảnh lưu niệm dưới hàng cây.\nKhi ra về:\n- Chuyến tham quan kết thúc vào lúc gần trưa.\n- Hành động: mọi người lên xe, vẫy tay tạm biệt.\n- Cảm xúc: em thấy vui và thêm kính yêu Bác Hồ.',
    'Trước khi tham quan:\n- Thời gian, địa điểm: sáng thứ Bảy, lớp em đi dã ngoại ở công viên.\n- Cảnh vật, con người: nắng nhẹ, cây xanh mát, các bạn cười nói rộn ràng.\nKhi đến nơi tham quan:\n- Đầu tiên: cả lớp cùng cô trải bạt, chuẩn bị đồ ăn.\n- Sau đó: chúng em chơi các trò chơi tập thể.\n- Tiếp theo: em cùng bạn đi ngắm hồ nước và cho cá ăn.\n- Cuối cùng: cả lớp cùng nhau ăn trưa vui vẻ.\nKhi ra về:\n- Chuyến đi kết thúc lúc ba giờ chiều.\n- Hành động: mọi người thu dọn rác, lên xe ra về.\n- Cảm xúc: ai cũng lưu luyến và mong có dịp đi chơi lần nữa.',
  ],
  '6a465c230074fdef48a9118a': [
    'Tuổi học trò của mỗi người luôn gắn liền với những hoạt động sôi nổi và đáng nhớ. Với em, kỉ niệm khó quên nhất chính là ngày thứ Sáu vừa rồi, khi em được tham dự Hội khỏe Phù Đổng do trường tổ chức. Đó thực sự là một ngày hội thể thao tràn đầy niềm vui và tinh thần rèn luyện sức khỏe mà em sẽ nhớ mãi.',
    'Có những trải nghiệm chỉ diễn ra trong một buổi nhưng lại để lại trong ta thật nhiều cảm xúc. Đối với em, đó là ngày thứ Sáu vừa qua, khi cả trường náo nức bước vào Hội khỏe Phù Đổng. Không khí thi đua sôi nổi của ngày hội ấy khiến em không thể nào quên.',
  ],
  // ---- Phiếu 3 ----
  '6a465c250074fdef48a911a0': [
    'Thân bài thuật lại một việc tốt em đã làm:\n- Mở đầu sự việc: Trên đường đi học về, em nhìn thấy một em bé bị lạc đang khóc bên vệ đường.\n- Diễn biến: Đầu tiên, em lại gần hỏi han và dỗ dành em bé. Sau đó, em hỏi tên bố mẹ và đưa em bé đến chú công an gần đó. Tiếp theo, chú công an đã liên lạc giúp và một lúc sau mẹ của em bé vội vàng chạy đến.\n- Kết thúc: Mẹ em bé cảm ơn em rối rít, còn em bé thì nín khóc và mỉm cười.',
    'Thân bài thuật lại một việc tốt em đã làm:\n- Mở đầu: Giờ ra chơi, em thấy một bạn bị ngã ở sân trường, đầu gối trầy xước.\n- Diễn biến: Đầu tiên, em chạy lại đỡ bạn dậy. Sau đó, em dìu bạn xuống phòng y tế. Tiếp theo, em ở lại động viên để bạn bớt đau.\n- Kết thúc: Bạn đã đỡ hơn và cảm ơn em, cô giáo cũng khen em biết giúp đỡ bạn bè.',
  ],
  // ---- Phiếu 4 ----
  '6a465c250074fdef48a911a4': [
    'Cuộc sống quanh ta có biết bao việc tốt được làm mỗi ngày. Vào thứ Bảy vừa rồi, khi đang chơi cùng các bạn, Na đã chứng kiến một cụ già tay xách nhiều đồ, loay hoay mãi mà không sang được đường. Không chần chừ, Na cùng các bạn đã chạy đến giúp cụ. Đó là một việc làm nhỏ nhưng khiến em rất cảm động.',
    'Giúp đỡ người khác luôn là một việc làm đáng quý. Thứ Bảy tuần trước, trong lúc chơi cùng các bạn, Na trông thấy một cụ già tay cầm nhiều đồ vật đang lúng túng không thể sang đường giữa dòng xe cộ. Ngay lập tức, Na và các bạn đã cùng nhau giúp cụ sang đường an toàn.',
  ],
  // ---- Phiếu 5 ----
  '6a465c280074fdef48a911c6': [
    'Kho tàng truyện cổ tích Việt Nam có biết bao câu chuyện hay, gửi gắm những bài học sâu sắc về cách sống ở đời. Mỗi lần được bà kể chuyện, em lại say sưa lắng nghe. Trong tất cả những câu chuyện ấy, em nhớ và yêu thích nhất là truyện cổ tích "Tấm Cám".',
    'Từ thuở nhỏ, em đã được nghe bà kể biết bao câu chuyện cổ tích thần kì. Những câu chuyện ấy như đưa em vào một thế giới diệu kì của cái thiện và cái ác. Trong số đó, câu chuyện để lại trong em nhiều ấn tượng nhất chính là truyện "Cây khế".',
  ],
  '6a465c280074fdef48a911c8': [
    'Câu chuyện đã khép lại nhưng bài học về ở hiền gặp lành vẫn còn mãi trong lòng em. Qua câu chuyện, em hiểu rằng người tốt bụng, thật thà nhất định sẽ được đền đáp xứng đáng, còn kẻ tham lam, độc ác sẽ bị trừng phạt. Em tự nhủ mình phải luôn sống lương thiện, biết yêu thương và giúp đỡ mọi người xung quanh.',
    'Gấp trang truyện lại, em vẫn còn bồi hồi mãi. Câu chuyện cổ tích không chỉ hay ở những chi tiết kì ảo mà còn dạy em bài học quý về lòng nhân hậu. Em mong sao trong cuộc sống, cái thiện sẽ luôn chiến thắng cái ác, và em sẽ cố gắng trở thành một người tốt như những nhân vật em yêu quý.',
  ],
  // ---- Phiếu 6 ----
  '6a465c290074fdef48a911da': [
    'Đất nước Việt Nam ta đã trải qua hàng nghìn năm dựng nước và giữ nước. Trong suốt chiều dài lịch sử ấy, có biết bao vị anh hùng đã hi sinh để bảo vệ non sông. Mỗi khi nghĩ về họ, em lại thấy vô cùng tự hào. Trong đó, câu chuyện về Hai Bà Trưng đã để lại trong em niềm cảm phục sâu sắc nhất.',
    'Lịch sử nước ta ghi dấu tên tuổi của nhiều anh hùng dân tộc có công lớn với đất nước. Những câu chuyện về họ luôn khiến em xúc động và tự hào. Hôm nay, em xin kể lại câu chuyện về người anh hùng nhỏ tuổi Trần Quốc Toản với lá cờ thêu sáu chữ vàng.',
  ],
  '6a465c2a0074fdef48a911dc': [
    'Câu chuyện đã kết thúc nhưng hình ảnh người anh hùng vẫn còn in đậm trong tâm trí em. Em vô cùng biết ơn và tự hào về những vị anh hùng đã hi sinh vì đất nước. Em tự hứa sẽ chăm ngoan, học giỏi để sau này góp sức xây dựng quê hương ngày càng giàu đẹp.',
    'Kể xong câu chuyện, lòng em trào dâng niềm kính phục. Nhờ có những người con anh dũng như vậy mà đất nước ta mới được độc lập, tự do như hôm nay. Em nguyện sẽ học tập thật tốt để xứng đáng với công lao của cha ông đi trước.',
  ],
  // ---- Phiếu 8 ----
  '6a465c2d0074fdef48a911fe': [
    'Câu chuyện khép lại để lại trong em nhiều suy nghĩ. Em thật sự khâm phục trí thông minh và sự nhanh trí của nhân vật. Qua đó, em hiểu rằng trí tuệ là một điều quý giá, và nếu chăm chỉ học tập, rèn luyện thì mỗi chúng ta đều có thể trở nên thông minh, giỏi giang hơn.',
    'Gấp lại câu chuyện, em càng thêm cảm phục sự thông minh, tài trí của nhân vật. Em nhận ra rằng trí thông minh không tự nhiên mà có, nó đến từ sự chăm chỉ và ham học hỏi. Em sẽ cố gắng học tập thật tốt để mai này trở thành người có ích.',
  ],
  '6a465c2d0074fdef48a91202': [
    'Trong cuộc sống, lòng dũng cảm luôn là một phẩm chất đáng quý. Có biết bao câu chuyện cảm động về những con người dám đương đầu với khó khăn, nguy hiểm để bảo vệ lẽ phải. Một trong những câu chuyện khiến em nhớ mãi và cảm phục nhất là câu chuyện về chú bé liên lạc Kim Đồng dũng cảm.',
    'Lòng dũng cảm là ngọn lửa sáng trong mỗi con người. Em từng được nghe và đọc nhiều câu chuyện ca ngợi những tấm gương gan dạ, không sợ hiểm nguy. Trong đó, câu chuyện về anh hùng nhỏ tuổi Lê Văn Tám đã để lại trong em niềm xúc động sâu sắc.',
  ],
  // ---- Phiếu 9 ----
  '6a465c2e0074fdef48a91210': [
    'Những cánh hoa mỏng manh rung rinh trong gió trông như đàn bướm nhỏ đang chấp chới bay lượn.',
    'Mỗi cánh hoa xinh xắn khẽ đung đưa tựa như một chú bướm đang dập dờn trên cành.',
  ],
  '6a465c2e0074fdef48a91212': [
    'Những chiếc lá xanh khẽ đung đưa trong gió như đang vẫy tay chào đón em đến trường.',
    'Trên cành cao, các bạn lá tinh nghịch vẫy tay chào mỗi khi cơn gió nhẹ thổi qua.',
  ],
  '6a465c2f0074fdef48a91216': [
    '1. Thị giác\n- Cánh sen: hồng phớt, mềm mại như nhung.\n- Đài sen: như cái chén nhỏ, xanh mướt.\n- Hạt sen: khi đài khô, hạt nổi lên, trắng ngà.\n2. Thính giác: ong bướm rì rào bay lượn quanh hoa.\n3. Xúc giác: cánh hoa mềm mại, mát rượi.\n5. Vị giác:\n- Hạt sen: bùi, ngọt thanh.',
  ],
  // ---- Phiếu 10 ----
  '6a465c2f0074fdef48a9121e': [
    '1. Múi sầu riêng vàng óng, ngọt lịm như được ướp mật ong.\n2. Những chiếc lá bàng to bản xòe rộng như chiếc quạt mo che mát cả góc sân.\n3. Chùm hoa cau trắng muốt, xốp nhẹ trông như những viên kẹo bông gòn.',
    '1. Múi sầu riêng béo ngậy, ngọt ngào tựa như một thìa mật ong sóng sánh.\n2. Lá bàng rộng và dày như chiếc quạt mo của bà đang phe phẩy trong gió.\n3. Hoa cau li ti kết thành chùm trắng bồng bềnh như kẹo bông gòn.',
  ],
  '6a465c300074fdef48a91220': [
    '1. Chị hoa đào không chịu biến mất mà e ấp ngủ vùi, đợi mùa xuân sang lại bừng tỉnh khoe sắc.\n2. Gió tinh nghịch chạy qua khiến những cánh hoa giật mình buông tay, rơi lả tả xuống mặt đất.\n3. Thân cây cần mẫn cong lưng đỡ lấy những quả bưởi trĩu nặng.',
    '1. Nàng hoa đào chẳng hề rời đi, chỉ lặng lẽ chờ xuân về để lại bừng nở rực rỡ.\n2. Cơn gió nghịch ngợm thổi làm những cánh hoa vội vã rủ nhau rơi lả tả.\n3. Thân cây vươn mình cong xuống, ân cần nâng niu những trái bưởi to tròn.',
  ],
  // ---- Phiếu 11 ----
  '6a465c320074fdef48a9123a': [
    'Nên miêu tả lá cây lộc vừng theo trình tự thời gian (theo từng mùa trong năm): từ cuối đông khi cây trút lá, sang đầu xuân khi cây đâm chồi nảy lộc, rồi đến mùa hè lá xanh tốt và mùa thu lá chuyển màu. Vì lộc vừng là cây thay lá nên tả theo thời gian sẽ làm nổi bật được sự thay đổi của lá.',
  ],
  '6a465c320074fdef48a9123c': [
    'Người ta ví cây lộc vừng như một nhà ảo thuật tài ba luôn thay đổi sắc áo theo mùa. Mùa xuân, cây khoác lên mình chiếc áo xanh non mơn mởn của những chồi lá mới. Sang hè, lá dày lên, xanh thẫm một màu tràn đầy sức sống. Khi thu về, lá ngả sang màu vàng rồi đỏ ối. Đến cuối đông, cây lại trút bỏ tấm áo cũ, đứng trầm ngâm chờ một mùa xuân mới.',
    'Người ta ví cây lộc vừng như một nhà ảo thuật tài ba luôn thay đổi sắc áo. Đầu xuân, những lộc non hé mở màu xanh biếc đầy tươi mới. Vào hè, cả tán cây rợp một màu xanh mát rượi. Thu sang, lá dần chuyển vàng rồi đỏ rực như lửa. Và khi đông đến, cây lặng lẽ rụng hết lá để nghỉ ngơi, đợi chờ ngày hồi sinh.',
  ],
  '6a465c320074fdef48a9123e': [
    'Nàng tiên mùa đông khẽ khàng bước đến cũng là lúc hoa sữa bắt đầu nở rộ. Những chùm hoa nhỏ li ti màu trắng ngà kết vào nhau, e ấp trong vòm lá xanh. Mỗi khi cơn gió heo may thổi qua, hương hoa lại tỏa ra nồng nàn, ngây ngất khắp con phố. Mùi hương ấy vừa quyến rũ lại vừa dịu êm, khiến ai đi qua cũng phải bồi hồi. Hoa sữa cứ thế lặng lẽ ướp hương cho cả một mùa đông Hà Nội.',
  ],
  '6a465c320074fdef48a91240': [
    'Thiên nhiên cũng thể hiện sự ưu ái trước vẻ đẹp của phượng vĩ. Mỗi độ hè về, ông mặt trời như rót thêm nắng vàng để hoa phượng thêm rực rỡ. Những chú ve say sưa cất tiếng ca như bản nhạc chào đón mùa hoa. Đàn bướm cũng rủ nhau bay đến, chập chờn quanh những chùm hoa đỏ thắm. Cả bầu trời, nắng gió và muôn loài như cùng nhau tô điểm cho cây phượng thêm phần lộng lẫy.',
  ],
  // ---- Phiếu 12 ----
  '6a465c340074fdef48a91254': [
    'Miêu tả quả xoài:\n- Khi còn non:\n+ Thời điểm kết trái: sau khi hoa tàn, khoảng đầu mùa hè.\n+ Màu sắc, hình dáng: nhỏ bằng ngón tay, màu xanh non.\n+ Hương vị: chua gắt.\n- Khi quả chín:\n+ Thời điểm quả chín: giữa mùa hè.\n+ Bên ngoài:\n• Hình dáng: to bằng bàn tay, hơi cong.\n• Màu sắc, bề mặt vỏ: vàng ươm, vỏ nhẵn bóng.\n+ Bên trong:\n• Ruột/thịt: vàng óng, mềm mọng.\n• Hạt: to, dẹt, nằm giữa quả.',
  ],
  // ---- Phiếu 13 ----
  '6a465c350074fdef48a9125c': [
    '1. Những quả cà chua đỏ chót treo lúc lỉu trên cành như những chiếc đèn lồng nhỏ xíu.\n2. Quả cam tròn xoe, vàng ươm trông như những chú lợn con núc ních.\n3. Trái sầu riêng đầy gai nhọn tua tủa như một quả cầu gai khổng lồ.',
    '1. Quả cà chua chín đỏ chót, sáng lấp lánh như chiếc đèn lồng bé xinh.\n2. Những quả cam tròn xoe xếp cạnh nhau như đàn lợn con mũm mĩm.\n3. Trái sầu riêng khoác chiếc áo đầy gai nhọn, y hệt một quả cầu gai.',
  ],
  '6a465c350074fdef48a9125e': [
    '1. Rặng dừa khẽ nghiêng mình, đung đưa mái tóc xanh như đang trò chuyện cùng làn gió.\n2. Sáng sớm, những quả cà chua khoác lên mình chiếc áo sương long lanh như được dát bạc.\n3. Cây bưởi kiêu hãnh phô ra những quả to tròn như những chiếc đèn vàng dưới ánh nắng.',
  ],
  '6a465c350074fdef48a91260': [
    'Cây dừa đứng nghiêng mình soi bóng bên bờ ao. Trên ngọn cao, những quả dừa tròn xoe kết thành từng buồng, treo lủng lẳng như đàn con thơ đang say ngủ. Vỏ dừa xanh bóng, bên trong chứa đầy nước ngọt mát lành. Ôi, những trái dừa quê hương sao mà thân thương đến thế! Em yêu biết bao hình bóng cây dừa gắn liền với tuổi thơ của mình.',
  ],
  '6a465c360074fdef48a91268': [
    'Dàn ý tả cây hoa đào:\n1. Mở bài: Giới thiệu cây hoa đào (trồng ở đâu, dịp Tết).\n2. Thân bài:\n- Tả bao quát: dáng cây, độ cao, thế cây.\n- Tả chi tiết:\n+ Gốc, thân: nâu sẫm, xù xì.\n+ Cành: mảnh, uốn lượn mềm mại.\n+ Lá: nhỏ, xanh non.\n+ Hoa: cánh mỏng, màu hồng phai, nở thành chùm.\n+ Nụ: chúm chím, e ấp.\n- Cây đào gắn với không khí ngày Tết.\n3. Kết bài: Tình cảm của em với cây hoa đào.',
  ],
  // ---- Phiếu 14 ----
  '6a465c360074fdef48a9126c': [
    '1. Ôi, những nụ hoa xinh xắn kia đang chúm chím như đôi môi bé thơ mỉm cười!\n2. Phải chăng những bông linh lan trắng muốt đang kiễng chân đứng thẳng trên cành cong để ngắm nhìn thế gian?\n3. Ôi chao, hoa phượng nở bung rực rỡ như thắp lên cả một bầu trời lửa đỏ!',
  ],
  '6a465c370074fdef48a9126e': [
    'Người ta ví hoa ly là một nàng công chúa yêu kiều bởi dáng vẻ thanh mảnh, mềm mại của nó. Những cánh hoa cong cong, uốn lượn duyên dáng như tà váy của nàng công chúa đang xòe ra. Sắc hoa khi thì trắng tinh khôi, khi lại hồng phớt dịu dàng. Từ nhụy hoa, một mùi hương thơm ngát cứ lan tỏa khắp căn phòng. Mỗi lần ngắm hoa ly, em lại thấy lòng mình dịu lại và tràn đầy yêu thương.',
  ],
  // ---- Phiếu 16 ----
  '6a465c3b0074fdef48a912a2': [
    'Nhà em nuôi rất nhiều con vật: nào gà, nào mèo, nào cá cảnh. Mỗi con một vẻ đáng yêu riêng khiến em quấn quýt cả ngày. Nhưng trong tất cả, em yêu quý nhất là chú chó Vàng — người bạn nhỏ trung thành đã gắn bó với gia đình em suốt mấy năm nay.',
    'Ai trong chúng ta cũng có một con vật mà mình yêu quý. Với em, đó không phải là con vật to lớn hay quý hiếm, mà chỉ là chú mèo mướp nhỏ mẹ mua cho từ năm ngoái. Chú mèo ấy đã trở thành người bạn thân thiết của em mỗi ngày.',
  ],
  '6a465c3b0074fdef48a912a4': [
    'Chú chó nhỏ không chỉ là một con vật nuôi mà đã trở thành một thành viên trong gia đình em. Em yêu quý chú lắm và luôn chăm sóc chú thật chu đáo. Em mong chú sẽ luôn khỏe mạnh để mãi là người bạn trung thành, cùng em lớn lên với biết bao kỉ niệm đẹp.',
    'Có chú mèo nhỏ, ngôi nhà của em như vui hơn hẳn. Em coi chú như một người bạn thân thiết chứ không chỉ là con vật nuôi. Em tự nhủ sẽ chăm sóc, yêu thương chú thật nhiều để tình bạn giữa em và chú ngày càng gắn bó.',
  ],
  // ---- Phiếu 17 ----
  '6a465c3c0074fdef48a912b2': [
    'Chú chó nhà em có bộ lông vàng óng mượt mà như một tấm thảm nhung.',
    'Đôi mắt của chú chó tròn xoe, đen láy như hai hòn bi ve long lanh.',
  ],
  '6a465c3d0074fdef48a912b4': [
    'Ôi, chú sóc nhỏ mới nhanh nhẹn làm sao!',
    'Cái đuôi xù của chú sóc trông chẳng khác nào một chiếc chổi lông mềm mại phải không?',
  ],
  '6a465c3d0074fdef48a912b6': [
    'Chú mèo mướp nhà em thật đáng yêu. Mỗi buổi sáng, chị mèo lại uể oải vươn vai rồi dụi đầu vào chân em nũng nịu đòi ăn. Đôi mắt xanh biếc của chú lim dim như đang mơ màng. Khi bắt được chuột, chú kiêu hãnh ngẩng cao đầu như một chàng dũng sĩ vừa lập chiến công. Em yêu chú mèo tinh nghịch ấy biết bao.',
    'Chú gà trống nhà em oai vệ như một chàng hiệp sĩ. Mỗi sáng sớm, chú dõng dạc cất tiếng gáy vang gọi ông mặt trời thức dậy. Bộ lông nhiều màu của chú óng ánh dưới nắng trông thật rực rỡ. Chú bước đi khệnh khạng, chốc chốc lại vỗ cánh phành phạch như để khoe sức mạnh của mình. Em rất thích ngắm chú gà đáng yêu ấy.',
  ],
  '6a465c3d0074fdef48a912b8': [
    'Chú chó Vàng không chỉ giữ nhà giỏi mà còn là người bạn thân thiết của em. Em yêu quý chú vô cùng và luôn dành cho chú những gì tốt nhất. Em mong chú sẽ mãi khỏe mạnh để cùng em vui đùa và trông coi ngôi nhà thân yêu này.',
  ],
  // ---- Phiếu 18 ----
  '6a465c3e0074fdef48a912c2': [
    'Lần đầu tiên được bố mẹ cho đi Thảo Cầm Viên, em đã vô cùng thích thú trước biết bao loài vật. Nhưng ấn tượng và khiến em nhớ mãi cho đến tận bây giờ chính là hình ảnh chú sư tử oai phong ngồi trên tảng đá lớn. Dáng vẻ dũng mãnh của "chúa tể rừng xanh" ấy đã in sâu vào tâm trí em.',
  ],
  '6a465c3f0074fdef48a912ca': [
    'Con trâu đã gắn bó thân thiết với người nông dân và làng quê Việt Nam từ bao đời nay. Em yêu quý con trâu hiền lành, chăm chỉ ấy biết bao. Mỗi khi nhìn thấy hình ảnh chú trâu cần mẫn kéo cày trên đồng, em lại thêm trân trọng những giọt mồ hôi vất vả của bác nông dân và thêm yêu quê hương mình.',
  ],
  '6a465c3f0074fdef48a912cc': [
    'Con hổ hiện ra thật oai phong và dũng mãnh. Toàn thân nó khoác một bộ lông vàng óng điểm những vằn đen sẫm. Cái đầu to tròn với đôi mắt sắc lạnh như tóe lửa. Bộ ria mép dài vểnh lên trông đầy uy nghi. Mỗi bước chân của nó đều nhẹ nhàng mà chắc nịch, xứng danh là "chúa tể của rừng xanh".',
  ],
  // ---- Phiếu học tập: Bài văn miêu tả cây cối (đọc hiểu + viết) ----
  '6a465c3f0074fdef48a912ce': [
    '- Lá cây: xanh mướt, hình bầu dục, mặt lá nhẵn bóng, gân lá nổi rõ.\n- Thân cây: to, chắc khỏe, vỏ nâu sần sùi, có nhiều cành vươn ra các phía.\n- Hoa: nhỏ xinh, cánh mỏng manh, tỏa hương thơm dịu nhẹ, kết thành từng chùm.',
  ],
  '6a465c3f0074fdef48a912d0': [
    'a. Tác giả miêu tả các bộ phận: lá, cành, hoa và quả của cây na.\nb. \n- Lá: không lớn; cành chẳng um tùm, toàn thân toát ra không khí mát dịu, êm ả.\n- Hoa: mang màu xanh của lá non, lẫn trong cành, tỏa hương thơm dịu ngọt, ấm cúng.\n- Quả: nhỏ bé, tròn vo, mỗi ngày một lớn, "mở biết bao nhiêu là mắt" để ngắm nhìn.',
  ],
  '6a465c3f0074fdef48a912d2': [
    '- Lá của cây bàng: xanh mướt, to bản, dày dặn.\n- Thân của cây bàng: to, thẳng, màu nâu sẫm, sần sùi.\n- Rễ cây: to, nổi lên trên mặt đất, ngoằn ngoèo như những con rắn.\n- Hoa phượng: đỏ rực, mỏng manh, nở thành chùm.\n- Quả bàng: nhỏ, hình bầu dục, khi chín có màu vàng.',
  ],
  '6a465c400074fdef48a912d4': [
    'a. Tác giả tả lá cây bàng theo trình tự thời gian, tức là tả sự thay đổi của lá qua bốn mùa: mùa xuân, mùa hè, mùa thu và mùa đông.\nb. Trình tự miêu tả ấy rất phù hợp để tả lá cây bàng, vì lá bàng thay đổi màu sắc rõ rệt theo từng mùa, nên tả theo thời gian sẽ làm nổi bật được vẻ đẹp riêng của lá bàng ở mỗi mùa.',
  ],
  '6a465c400074fdef48a912d6': [
    'Bài văn miêu tả cây bàng theo trình tự kết hợp: trước tiên tả bao quát cây bàng (nhìn từ xa, lại gần), sau đó tả sự thay đổi của cây theo trình tự thời gian — lần lượt qua bốn mùa xuân, hạ, thu, đông.',
  ],
  '6a465c400074fdef48a912d8': [
    'Người viết miêu tả cây bàng tại bốn thời điểm, đó là bốn mùa trong năm: mùa xuân, mùa hạ, mùa thu và mùa đông.',
  ],
  '6a465c400074fdef48a912da': [
    'Phần thân bài của bài văn miêu tả cây cối cần: tả bao quát về cây (hình dáng, kích thước), rồi tả chi tiết từng bộ phận của cây (gốc, thân, cành, lá, hoa, quả...) hoặc tả sự thay đổi của cây theo từng thời kì, từng mùa.',
  ],
  '6a465c400074fdef48a912dc': [
    'Phần kết bài của bài văn miêu tả cây cối cần: nêu lên tình cảm, cảm xúc, suy nghĩ của người viết đối với cây được miêu tả (yêu quý, gắn bó, những kỉ niệm với cây...).',
  ],
  '6a465c400074fdef48a912de': [
    'Việc bày tỏ ấn tượng, cảm xúc của người viết về cây cối được miêu tả thường nằm ở phần kết bài; ngoài ra cũng có thể lồng ghép trong phần thân bài.',
  ],
  '6a465c410074fdef48a912e0': [
    'Có 2 cách kết bài: kết bài mở rộng và kết bài không mở rộng.',
  ],
  '6a465c410074fdef48a912e2': [
    'Kết bài gồm hai dạng: kết bài mở rộng và kết bài không mở rộng.',
  ],
  '6a465c410074fdef48a912e4': [
    'Cây hoa sữa được miêu tả theo trình tự kết hợp: đầu tiên giới thiệu bao quát, sau đó tả chi tiết từng bộ phận của cây (thân, cành, lá, hoa), cuối cùng là những kỉ niệm và tình cảm của người viết gắn bó với cây.',
  ],
  '6a465c410074fdef48a912e6': [
    'Theo người viết, con người dành cho cây hoa sữa tình cảm yêu mến, gắn bó và trân trọng. Ai đi xa cũng "để thương, để nhớ" hoa sữa trong tâm hồn mình; hoa sữa đã trở thành một phần thân thuộc của người Hà Nội.',
  ],
  '6a465c410074fdef48a912e8': [
    'Rễ cây không phải là bộ phận của cây hoa sữa được miêu tả trong bài văn (bài chỉ tả thân, cành, lá và hoa).',
  ],
  '6a465c410074fdef48a912ea': [
    'Câu văn miêu tả bao quát cây hoa sữa khi nhìn từ xa là: "Những ngày hè nóng nực, cây như một chiếc ô xanh che mát cho mấy bác xích lô, những người khách bộ hành..."',
  ],
  '6a465c420074fdef48a912ec': [
    'Giọng điệu của người viết khi miêu tả cây hoa sữa nhẹ nhàng, tha thiết, chan chứa tình yêu thương và niềm tự hào đối với cây hoa sữa và mảnh đất Hà Nội.',
  ],
  '6a465c420074fdef48a912ee': [
    'Tác giả sử dụng khứu giác (mũi) để cảm nhận hương thơm và thị giác (mắt) để quan sát màu sắc, hình dáng của cây thảo quả.',
  ],
  '6a465c420074fdef48a912f0': [
    'Tác giả đã quan sát các bộ phận của cây thảo quả: hạt (thảo quả gieo trên đất), thân, nhánh, lá, hoa (hoa nảy dưới gốc cây) và quả (những chùm thảo quả chín đỏ).',
  ],
  '6a465c420074fdef48a912f2': [
    'Ghép chi tiết với giác quan:\n1 → mũi (khứu giác): hương thơm ngây ngất.\n2 → mắt (thị giác): quan sát sự lớn lên, đâm nhánh.\n3 → mắt (thị giác): thấy hoa kết trái, quả chín đỏ chon chót.\n4 → mắt (thị giác): rừng sáng như có lửa hắt lên.\n5 → mũi (khứu giác): rừng ngập hương thơm.',
  ],
  '6a465c430074fdef48a912f4': [
    'Dàn ý tả cây bưởi:\n1. Mở bài: Giới thiệu cây bưởi (trồng ở góc vườn nhà em).\n2. Thân bài:\n- Tả bao quát: cây cao chừng hai mét, tán lá xum xuê.\n- Tả chi tiết:\n+ Gốc, thân: to bằng bắp chân, vỏ màu nâu xám.\n+ Cành, lá: cành vươn rộng; lá to, dày, xanh thẫm, có eo lá.\n+ Hoa: trắng muốt, năm cánh, thơm ngào ngạt.\n+ Quả: tròn to, khi chín màu vàng, múi mọng nước, ngọt thanh.\n3. Kết bài: Tình cảm của em với cây bưởi và những kỉ niệm bên gốc bưởi.',
  ],
  '6a465c430074fdef48a912f6': [
    'Quan sát quả cam bằng các giác quan:\n01. Miệng - nếm: vị ngọt thanh, hơi chua nhẹ, mọng nước.\n02. Tai - nghe: tiếng tách nhẹ khi bóc vỏ, tiếng "rào rào" khi tép cam vỡ ra.\n03. Mắt - thấy: quả tròn xoe, vỏ vàng óng, các múi xếp đều như những chiếc thuyền nhỏ.\n04. Cảm nhận của em: quả cam thơm ngon, mát lành, khiến em thấy thật thích thú.',
  ],
};

// ==== Bài văn hoàn chỉnh cho 16 bài "Đề bài" tự luận (mỗi bài chọn 1 đề con) ====
const EXERCISE_ESSAYS = {
  // Viết bài văn kể lại một câu chuyện đã đọc hoặc đã nghe
  '6a465c430074fdef48a912f8': [
    'Trong kho tàng truyện cổ tích Việt Nam, em thích nhất câu chuyện "Cây khế". Ngày xưa, có hai anh em nhà nọ, cha mẹ mất sớm. Người anh tham lam chiếm hết gia tài, chỉ chia cho em một cây khế và túp lều nhỏ. Người em hiền lành chăm chỉ vun trồng, cây khế ra quả sai trĩu. Một hôm, có con chim lạ đến ăn khế và hứa "ăn một quả, trả một cục vàng". Người em may túi ba gang theo lời chim, được chim chở ra đảo lấy vàng và trở nên giàu có. Người anh biết chuyện, đòi đổi gia tài lấy cây khế. Vì tham lam may túi quá to, ôm nhiều vàng, anh ta bị rơi xuống biển. Câu chuyện dạy em bài học: ở hiền gặp lành, còn tham lam thì sẽ chuốc lấy hậu quả.',
    'Bà em thường kể cho em nghe câu chuyện "Sự tích cây vú sữa" rất cảm động. Ngày xưa, có một cậu bé được mẹ hết mực yêu thương nhưng lại ham chơi, ngỗ nghịch. Một lần bị mẹ mắng, cậu giận dỗi bỏ nhà đi. Người mẹ ở nhà mỏi mắt chờ con, khóc cạn nước mắt rồi qua đời, hóa thành một cái cây. Khi cậu bé đói khát trở về, không thấy mẹ đâu, cậu ôm lấy cây mà khóc. Kì lạ thay, cây bỗng trổ ra những quả ngọt lành, dòng sữa trắng chảy ra ngọt như sữa mẹ. Cậu bé hối hận vô cùng. Câu chuyện khiến em thấm thía tình yêu thương bao la của mẹ và tự nhủ phải luôn ngoan ngoãn, hiếu thảo với cha mẹ.',
    'Em đã được đọc câu chuyện "Rùa và Thỏ" và rất tâm đắc. Ngày xưa, Thỏ vốn chạy rất nhanh nên coi thường Rùa chậm chạp. Thỏ thách Rùa chạy thi và tin chắc mình sẽ thắng. Vào cuộc, Thỏ chạy vụt đi, bỏ xa Rùa. Thấy còn nhiều thời gian, Thỏ nằm ngủ dưới gốc cây. Còn Rùa thì cứ kiên trì bò từng bước, không nghỉ ngơi. Khi Thỏ tỉnh dậy thì Rùa đã về đích từ lúc nào. Câu chuyện dạy em rằng chớ nên kiêu ngạo, chủ quan; chỉ cần chăm chỉ, kiên trì thì nhất định sẽ thành công.',
  ],
  // Kể lại câu chuyện có chi tiết sáng tạo (theo lời nhân vật, đổi kết thúc)
  '6a465c430074fdef48a912f9': [
    'Em xin kể lại truyện "Cây khế" theo lời của chú chim thần. Tôi là chú chim phượng hoàng sống ngoài biển khơi. Một ngày nọ, bay ngang qua vườn nhà một chàng trai nghèo, tôi thấy cây khế sai quả liền sà xuống ăn. Chàng trai không đuổi tôi mà chỉ buồn rầu vì đó là gia tài duy nhất. Cảm động trước tấm lòng hiền lành ấy, tôi hứa "ăn khế trả vàng" và chở chàng ra đảo lấy vàng. Chàng chỉ lấy vừa đủ một túi ba gang. Về sau, người anh tham lam bắt tôi chở đi, nhưng ông ta lấy quá nhiều vàng khiến tôi kiệt sức, đành phải nghiêng cánh. Từ câu chuyện của mình, tôi muốn nhắn nhủ: lòng tham sẽ hại chính con người.',
    'Em xin kể lại truyện "Tấm Cám" theo lời của cô Tấm. Tôi là Tấm, mồ côi mẹ từ nhỏ, sống cùng dì ghẻ và em Cám. Tôi phải làm lụng vất vả nhưng vẫn luôn hiền lành, chăm chỉ. Nhờ có Bụt giúp đỡ, tôi có được con cá bống làm bạn, rồi có quần áo đẹp đi trẩy hội và trở thành hoàng hậu. Nhưng mẹ con Cám nhiều lần hãm hại tôi. Tôi đã hóa thân qua bao lần: thành chim vàng anh, cây xoan đào, khung cửi, rồi quả thị. Cuối cùng, tôi được trở lại làm người và sống hạnh phúc bên nhà vua. Qua câu chuyện của mình, tôi tin rằng người hiền lành, lương thiện nhất định sẽ được hưởng hạnh phúc.',
    'Em xin kể lại truyện "Cô bé bán diêm" với một kết thúc khác. Đêm giao thừa giá rét, cô bé bán diêm co ro nơi góc phố. Em quẹt từng que diêm để sưởi ấm và mơ về những điều đẹp đẽ. Nhưng lần này, khi que diêm cuối cùng vụt tắt, một bác hàng xóm tốt bụng đi ngang qua đã trông thấy em. Bác vội bế em vào nhà, ủ ấm và cho em bát cháo nóng. Sáng hôm sau, bác nhận em về nuôi. Từ đó, cô bé không còn phải chịu đói rét nữa mà được đến trường, được yêu thương. Em đã thêm cái kết ấy vì mong mọi em nhỏ bất hạnh đều tìm được hạnh phúc và tình người ấm áp.',
  ],
  // Viết bài văn miêu tả con vật
  '6a465c430074fdef48a912fa': [
    'Nhà em nuôi một chú chó tên là Vàng, đó là con vật em yêu quý nhất. Chú Vàng năm nay đã hai tuổi, thân hình chắc nịch với bộ lông vàng óng mượt mà. Cái đầu tròn xinh, đôi tai dựng đứng luôn vểnh lên nghe ngóng. Đôi mắt chú đen láy, tròn xoe như hai hòn bi ve. Chiếc mũi ươn ướt lúc nào cũng đánh hơi rất thính. Mỗi khi em đi học về, chú lại vẫy đuôi rối rít, chạy ra mừng quấn quýt bên chân em. Ban đêm, chú nằm canh cửa, chỉ cần có tiếng động lạ là sủa vang báo hiệu. Em yêu chú Vàng lắm, chú vừa là vật nuôi trung thành vừa là người bạn thân thiết của em.',
    'Trong các con vật nuôi, em thích nhất chú mèo mướp mẹ mua cho hồi đầu năm. Chú mèo có bộ lông mềm mại với những vằn xám đen xen kẽ trông thật đáng yêu. Cái đầu tròn như quả cam, đôi tai nhỏ luôn vểnh lên. Đôi mắt chú màu xanh trong veo, ban đêm sáng lên như hai viên ngọc. Bộ ria mép trắng cứng giúp chú đánh hơi và bắt chuột rất tài. Những chiếc chân có đệm thịt êm ái nên chú đi lại nhẹ nhàng, không gây tiếng động. Ban ngày chú thường nằm cuộn tròn sưởi nắng, chốc chốc lại lim dim ngủ. Em rất quý chú mèo và luôn chăm sóc chú thật cẩn thận.',
    'Ở quê ngoại, em thích nhất chú gà trống của bà. Chú gà to khỏe, khoác trên mình bộ lông nhiều màu óng ả. Cái mào đỏ chót dựng đứng trên đầu trông thật oai vệ. Đôi mắt tròn, sáng lanh lợi, chiếc mỏ vàng cứng cáp. Đôi chân cao có cựa nhọn và những móng sắc. Mỗi sáng tinh mơ, chú nhảy lên đống rơm, vỗ cánh phành phạch rồi cất tiếng gáy "Ò ó o" vang cả xóm như gọi mọi người thức dậy. Chú bước đi khệnh khạng, đầu ngẩng cao đầy kiêu hãnh. Em rất thích chú gà trống oai phong ấy và luôn ra cho chú ăn mỗi khi về thăm bà.',
  ],
  // Viết bài văn miêu tả cây cối
  '6a465c430074fdef48a912fb': [
    'Giữa sân trường em có một cây phượng vĩ đã bao năm tỏa bóng mát. Nhìn từ xa, cây phượng như một chiếc ô khổng lồ màu xanh. Gốc cây to, phải hai bạn ôm mới xuể, vỏ nâu sẫm sần sùi. Thân cây vươn thẳng, chia thành nhiều cành xòe rộng. Lá phượng nhỏ li ti, mọc đối nhau trông như những chiếc lông chim xanh mướt. Mỗi độ hè về, phượng nở hoa đỏ rực cả một góc trời, báo hiệu mùa thi và mùa chia tay. Dưới gốc phượng, chúng em vui đùa, nhặt cánh hoa ép vào trang vở. Em yêu cây phượng lắm, cây đã gắn bó với biết bao kỉ niệm tuổi học trò của chúng em.',
    'Trong vườn nhà em có một cây bưởi mà cả nhà ai cũng quý. Cây cao chừng hai mét, tán lá xum xuê tỏa rộng. Gốc bưởi to bằng bắp chân người lớn, vỏ màu nâu xám. Những cành cây vươn ra các phía, mang theo tán lá to, dày, xanh thẫm. Mỗi độ xuân về, bưởi nở hoa trắng muốt, năm cánh, tỏa hương thơm ngào ngạt khắp vườn. Đến mùa, cây kết những quả bưởi tròn to, khi chín vỏ ngả vàng, bên trong múi mọng nước, ngọt lịm. Ông em thường hái bưởi bày mâm ngũ quả ngày rằm. Em rất yêu cây bưởi, nó đã gắn bó với gia đình em qua bao mùa quả ngọt.',
    'Trước cửa lớp em có một cây bàng thân thuộc. Nhìn từ xa, cây bàng như một chiếc ô nhiều tầng xanh mát. Thân cây to, thẳng, màu nâu sẫm, sần sùi vì đã trải qua bao mưa nắng. Cây bàng thay đổi theo bốn mùa: mùa xuân đâm chồi non li ti, mùa hè lá xanh rợp che bóng mát cho chúng em vui chơi, mùa thu lá ngả vàng rồi đỏ tía, đến mùa đông thì trơ trụi cành khẳng khiu. Giờ ra chơi, chúng em thường tụ tập dưới gốc bàng đọc sách, trò chuyện. Cây bàng đã chứng kiến biết bao kỉ niệm buồn vui của chúng em. Dù mai này có xa mái trường, em vẫn mãi nhớ về cây bàng thân yêu ấy.',
  ],
  // Viết bài văn miêu tả cảnh
  '6a465c430074fdef48a912fc': [
    'Em yêu nhất là cảnh biển quê em vào buổi sáng sớm. Khi ông mặt trời từ từ nhô lên khỏi mặt nước, cả bầu trời bừng sáng một màu hồng rực rỡ. Mặt biển mênh mông, xanh biếc, lấp lánh ánh nắng như được dát vàng. Từng con sóng bạc đầu nối đuôi nhau xô vào bờ cát, tạo nên âm thanh rì rào không ngớt. Bãi cát vàng mịn còn in dấu chân người. Xa xa, những chiếc thuyền đánh cá no đầy tôm cá đang trở về sau một đêm ra khơi. Trên bầu trời, từng đàn hải âu chao liệng. Khung cảnh biển buổi sớm thật đẹp và bình yên, khiến em thêm yêu quê hương mình.',
    'Cảnh sân trường em vào giờ ra chơi thật nhộn nhịp và vui tươi. Khi tiếng trống "tùng tùng" vang lên, từ các lớp học, học sinh ùa ra sân như đàn ong vỡ tổ. Cả sân trường bỗng rộn ràng tiếng cười nói. Dưới gốc bàng, mấy bạn nữ chơi nhảy dây, ô ăn quan. Giữa sân, các bạn nam đá cầu, đuổi bắt náo nhiệt. Góc kia, vài bạn ngồi đọc truyện, trò chuyện rất vui. Những chú chim sâu cũng nhảy nhót trên cành như hòa chung niềm vui. Khi trống báo vào lớp, sân trường lại trở về yên tĩnh. Em rất thích những giờ ra chơi bổ ích và đầy ắp tiếng cười ấy.',
    'Quê em đẹp nhất là cảnh cánh đồng lúa vào buổi chiều. Khi hoàng hôn buông xuống, cả cánh đồng nhuộm một màu vàng óng ả. Những bông lúa chín trĩu hạt, đung đưa theo làn gió như gợn sóng vàng mênh mông. Hương lúa mới thơm ngào ngạt lan tỏa khắp không gian. Trên bờ, các bác nông dân đang gặt lúa, gương mặt rạng rỡ niềm vui được mùa. Đàn cò trắng thong thả bay về tổ. Xa xa, những làn khói lam chiều vấn vít trên mái nhà. Cảnh cánh đồng quê buổi chiều thật thanh bình và ấm áp, khiến lòng em dâng lên tình yêu tha thiết với quê hương.',
  ],
  // Viết bài văn miêu tả người
  '6a465c440074fdef48a912fd': [
    'Người mà em yêu quý nhất trong gia đình là bà ngoại của em. Năm nay bà đã ngoài bảy mươi tuổi. Dáng bà nhỏ nhắn, hơi còng vì tuổi tác. Mái tóc bà bạc trắng như cước, được búi gọn sau gáy. Khuôn mặt bà hiền từ với nhiều nếp nhăn, in dấu bao vất vả của một đời tần tảo. Đôi mắt bà tuy đã mờ nhưng lúc nào cũng ánh lên sự trìu mến. Đôi bàn tay bà gầy guộc, chai sạn nhưng rất ấm áp. Mỗi tối, bà thường kể cho em nghe những câu chuyện cổ tích và vỗ về em ngủ. Em yêu bà lắm và mong bà luôn khỏe mạnh để sống thật lâu bên con cháu.',
    'Trong gia đình, người em kính yêu nhất là mẹ của em. Mẹ em năm nay ngoài ba mươi tuổi. Mẹ có dáng người thon thả, mái tóc dài đen mượt luôn được buộc gọn gàng. Khuôn mặt mẹ trái xoan, làn da trắng hồng. Đôi mắt mẹ đen láy, lúc nào cũng nhìn em thật dịu dàng. Nụ cười của mẹ ấm áp như ánh nắng ban mai. Đôi bàn tay mẹ tuy nhỏ nhắn nhưng khéo léo, ngày ngày chăm lo cho cả nhà từng bữa cơm, giấc ngủ. Mẹ luôn ân cần dạy em học và bảo ban em điều hay lẽ phải. Em yêu mẹ vô cùng và tự hứa sẽ chăm ngoan để mẹ vui lòng.',
    'Cô giáo chủ nhiệm của em là người em rất yêu quý và kính trọng. Cô tên là Lan, năm nay khoảng ba mươi tuổi. Cô có dáng người mảnh mai, mái tóc dài óng ả. Khuôn mặt cô phúc hậu, đôi mắt sáng và ấm áp. Giọng cô giảng bài lúc nào cũng nhẹ nhàng, truyền cảm khiến chúng em say mê lắng nghe. Mỗi khi có bạn chưa hiểu bài, cô đều kiên nhẫn giảng lại. Cô không chỉ dạy chữ mà còn dạy chúng em cách sống ngoan ngoãn, lễ phép. Em coi cô như người mẹ hiền thứ hai của mình. Em thầm hứa sẽ học thật giỏi để không phụ công dạy dỗ của cô.',
  ],
  // Viết bài văn thuật lại một sự việc đã chứng kiến hoặc tham gia
  '6a465c440074fdef48a912fe': [
    'Tuần trước, em đã tham gia buổi lao động dọn vệ sinh trường lớp cùng các bạn, đó là một kỉ niệm đáng nhớ. Sáng thứ Bảy, cả lớp em tập trung đông đủ, ai nấy đều hăng hái. Cô giáo phân công công việc cho từng tổ. Đầu tiên, tổ em quét dọn sân trường, nhặt từng cọng rác, chiếc lá khô. Sau đó, chúng em lau bàn ghế, cửa kính trong lớp cho sáng bóng. Tiếp theo, mấy bạn nam xách nước tưới cho bồn hoa xanh tốt. Ai cũng làm việc thật chăm chỉ, vừa làm vừa trò chuyện vui vẻ. Đến trưa, trường lớp đã sạch đẹp hẳn lên. Nhìn thành quả của mình, chúng em ai cũng thấy vui và tự hào. Qua buổi lao động, em hiểu rằng cần chung tay giữ gìn trường lớp sạch đẹp.',
    'Em xin thuật lại một việc tốt mà em đã chứng kiến trên đường đi học. Hôm ấy, khi đang trên đường tới trường, em thấy một cụ già chống gậy, tay xách túi nặng đứng lúng túng bên đường vì không sang được giữa dòng xe cộ đông đúc. Bỗng một bạn học sinh chạy đến, lễ phép hỏi han rồi dìu cụ sang đường. Bạn ấy còn xách túi giúp và đưa cụ đến tận vỉa hè bên kia mới yên tâm chào cụ ra về. Cụ già mỉm cười cảm ơn, ánh mắt đầy trìu mến. Chứng kiến việc làm đẹp ấy, em thấy rất cảm động và khâm phục bạn nhỏ. Em tự nhủ mình cũng phải biết quan tâm, giúp đỡ mọi người xung quanh.',
    'Em nhớ mãi lần em giúp mẹ làm việc nhà và cảm thấy rất vui. Chiều hôm đó, thấy mẹ đi làm về mệt, em liền xin được phụ mẹ. Đầu tiên, em quét nhà và lau bàn ghế sạch sẽ. Sau đó, em phụ mẹ nhặt rau, vo gạo nấu cơm. Tuy còn vụng về nhưng em làm rất cẩn thận. Tiếp theo, em còn gấp quần áo gọn gàng và trông em bé giúp mẹ. Khi mọi việc xong xuôi, mẹ ôm em vào lòng và khen em đã lớn, biết đỡ đần cha mẹ. Em vui sướng vô cùng. Từ việc làm nhỏ ấy, em hiểu rằng giúp đỡ cha mẹ chính là cách thể hiện tình yêu thương của mình.',
  ],
  // Viết thư cho bạn bè hoặc người thân
  '6a465c440074fdef48a912ff': [
    'Hà Nội, ngày 12 tháng 3 năm 2025\n\nMinh thân mến!\n\nĐã lâu rồi chúng mình chưa gặp nhau, mình nhớ cậu lắm. Dạo này cậu và gia đình vẫn khỏe chứ? Việc học của cậu ở trường mới thế nào rồi?\n\nCòn mình vẫn khỏe và học tập tốt. Lớp mình năm nay có nhiều bạn mới rất thân thiện. Mình vừa được cô khen vì đạt điểm cao môn Tiếng Việt đấy. Mình cũng tham gia câu lạc bộ đọc sách của trường và thấy rất thú vị.\n\nHè này, nếu có dịp, cậu về quê chơi với mình nhé. Chúng mình sẽ lại cùng nhau thả diều như ngày xưa. Mình mong sớm nhận được thư hồi âm của cậu.\n\nBạn thân của cậu\nHoa',
    'Thành phố Hồ Chí Minh, ngày 5 tháng 4 năm 2025\n\nÔng bà kính mến!\n\nĐã lâu cháu chưa về thăm ông bà, cháu nhớ ông bà nhiều lắm. Dạo này ông bà có khỏe không ạ? Vườn rau và đàn gà của bà vẫn tươi tốt chứ ạ?\n\nCháu và bố mẹ ở trên này vẫn khỏe, ông bà đừng lo. Cháu học hành chăm chỉ và vừa được giấy khen học sinh giỏi. Cháu còn biết phụ mẹ quét nhà, trông em nữa đấy ạ.\n\nHè này cháu sẽ xin bố mẹ cho về quê ở với ông bà thật lâu. Cháu mong được nghe bà kể chuyện và cùng ông ra vườn tưới cây. Cháu chúc ông bà luôn mạnh khỏe ạ.\n\nCháu của ông bà\nNam',
    'Đà Nẵng, ngày 20 tháng 2 năm 2025\n\nLan thương nhớ!\n\nMình nghe tin cậu bị ốm mấy hôm nay nên viết thư này hỏi thăm cậu. Bây giờ cậu đã đỡ hơn chưa? Cậu nhớ uống thuốc và nghỉ ngơi cho thật khỏe nhé.\n\nỞ lớp, các bạn ai cũng hỏi thăm và mong cậu chóng khỏe để đi học lại. Mình đã ghi chép bài đầy đủ, khi nào cậu khỏe mình sẽ mang sang cho cậu mượn và giảng lại những phần cậu chưa hiểu.\n\nCậu đừng lo lắng về việc học mà hãy tập trung nghỉ ngơi cho mau khỏe nhé. Mình mong sớm được gặp lại cậu ở lớp.\n\nBạn thân của cậu\nMai',
  ],
  // Viết đoạn văn giới thiệu nhân vật trong sách hoặc phim hoạt hình
  '6a465c440074fdef48a91300': [
    'Trong các bộ phim hoạt hình, em yêu thích nhất là nhân vật Doraemon. Doraemon là một chú mèo máy đến từ tương lai, có thân hình mũm mĩm màu xanh và chiếc bụng tròn trắng. Điều đặc biệt nhất của chú là chiếc túi thần kì trước bụng, chứa vô số bảo bối như chong chóng tre, cánh cửa thần kì... Doraemon rất tốt bụng, luôn hết lòng giúp đỡ cậu bạn Nobita hậu đậu vượt qua khó khăn. Tuy đôi khi hơi nhút nhát vì sợ chuột, nhưng chú luôn dũng cảm bảo vệ bạn bè. Em yêu quý Doraemon vì chú không chỉ vui nhộn mà còn dạy em bài học về tình bạn và lòng tốt.',
    'Nhân vật trong truyện cổ tích mà em yêu thích nhất là Thạch Sanh. Thạch Sanh là một chàng trai mồ côi, sống bằng nghề đốn củi dưới gốc đa. Chàng khỏe mạnh, thật thà và vô cùng dũng cảm. Thạch Sanh đã chém chằn tinh, bắn đại bàng cứu công chúa, thể hiện sức mạnh và lòng nghĩa hiệp. Dù nhiều lần bị Lí Thông lừa gạt, hãm hại, chàng vẫn giữ tấm lòng lương thiện, bao dung. Cuối cùng, chàng được kết hôn với công chúa và sống hạnh phúc. Em rất khâm phục Thạch Sanh và mong mình cũng sẽ dũng cảm, tốt bụng như chàng.',
    'Trong truyện "Dế Mèn phiêu lưu ký", em thích nhất nhân vật Dế Mèn. Dế Mèn là một chú dế thanh niên cường tráng với đôi càng mẫm bóng, đôi cánh dài chấm đuôi. Lúc đầu, Dế Mèn khá kiêu căng, xốc nổi nên đã gây ra lỗi lầm khiến Dế Choắt phải chết. Nhưng sau đó, Dế Mèn đã biết hối hận và thay đổi. Trên hành trình phiêu lưu, chú trở nên chững chạc, tốt bụng và giàu lòng nghĩa hiệp, luôn giúp đỡ những người yếu thế. Qua nhân vật Dế Mèn, em học được rằng ai cũng có thể mắc lỗi, quan trọng là biết nhận ra và sửa chữa để trưởng thành hơn.',
  ],
  // Viết đoạn văn nêu tình cảm, cảm xúc về bài thơ, câu chuyện
  '6a465c440074fdef48a91301': [
    'Trong những bài thơ đã học, em yêu thích nhất bài thơ "Chuyện cổ nước mình" của nhà thơ Lâm Thị Mỹ Dạ. Bài thơ đã đưa em trở về với thế giới cổ tích thân thương của dân tộc. Đọc từng câu thơ, em như nghe được lời ru ngọt ngào của bà, của mẹ. Bài thơ ca ngợi những câu chuyện cổ chứa đựng bao bài học quý về lòng nhân hậu, ở hiền gặp lành. Em xúc động khi hiểu rằng những câu chuyện cổ chính là kho báu tinh thần mà ông cha để lại. Bài thơ giúp em thêm yêu quý và trân trọng những giá trị tốt đẹp của quê hương, đất nước mình.',
    'Câu chuyện "Cô bé bán diêm" đã để lại trong em nhiều cảm xúc sâu sắc. Em vô cùng thương xót cho cô bé nghèo khổ phải bán diêm trong đêm giao thừa giá rét, không được ai đoái hoài. Qua ánh lửa của những que diêm, cô bé mơ về mái ấm, về tình yêu thương của bà. Chi tiết ấy khiến em nghẹn ngào và thấy cay cay nơi khóe mắt. Câu chuyện giúp em hiểu được nỗi bất hạnh của những em nhỏ kém may mắn. Từ đó, em càng biết trân trọng cuộc sống ấm no, hạnh phúc mình đang có và mong muốn được sẻ chia, yêu thương với những người xung quanh.',
    'Em rất thích bài thơ "Nếu chúng mình có phép lạ". Bài thơ thể hiện những ước mơ hồn nhiên, trong sáng và thật đẹp đẽ của tuổi thơ. Đó là ước mơ về một thế giới không còn chiến tranh, mọi trẻ em đều được ấm no, hạnh phúc. Đọc bài thơ, em cảm thấy vui tươi và như được chắp thêm đôi cánh để bay tới những điều tốt đẹp. Em hiểu rằng ước mơ giúp con người sống lạc quan và luôn cố gắng. Bài thơ khiến em muốn nuôi dưỡng những ước mơ đẹp và chăm chỉ học hành để biến ước mơ thành hiện thực.',
  ],
  // Viết đoạn văn nêu tình cảm, cảm xúc về người thân quen, gần gũi
  '6a465c440074fdef48a91302': [
    'Người mà em yêu thương nhất trên đời là mẹ của em. Mẹ có mái tóc dài đen mượt và đôi mắt hiền từ luôn nhìn em trìu mến. Hằng ngày, mẹ tần tảo lo toan mọi việc trong nhà, chăm sóc em từng bữa ăn, giấc ngủ. Mỗi khi em ốm, mẹ thức trắng đêm bên cạnh em. Khi em buồn, mẹ luôn là người an ủi, động viên em. Vòng tay mẹ ấm áp và giọng nói dịu dàng của mẹ chính là điều em yêu quý nhất. Em biết ơn mẹ vô cùng và tự hứa sẽ chăm ngoan, học giỏi để mẹ luôn vui lòng. Con yêu mẹ nhiều lắm!',
    'Trong gia đình, người em yêu quý và gắn bó nhất là ông nội. Ông đã già, mái tóc bạc phơ và chòm râu trắng như cước. Dù tuổi cao, ông vẫn còn minh mẫn và rất hiền hậu. Mỗi buổi chiều, ông thường dẫn em ra vườn chơi, dạy em cách chăm cây và kể cho em nghe những câu chuyện ngày xưa. Giọng ông trầm ấm khiến em say mê lắng nghe mãi không chán. Ông còn dạy em biết yêu thương, lễ phép với mọi người. Em yêu ông lắm và mong ông luôn mạnh khỏe để mãi ở bên em, cùng em vun đắp những kỉ niệm đẹp.',
    'Chị gái là người thân mà em yêu quý và ngưỡng mộ nhất. Chị hơn em bốn tuổi, có dáng người cao và mái tóc dài. Chị học rất giỏi và luôn là tấm gương để em noi theo. Mỗi tối, chị đều kiên nhẫn giảng bài, chỉ cho em những chỗ chưa hiểu. Khi bố mẹ bận, chị chăm sóc em chu đáo như một người mẹ nhỏ. Chị em tuy đôi lúc cũng cãi nhau nhưng luôn yêu thương, nhường nhịn nhau. Em cảm thấy thật hạnh phúc khi có một người chị tuyệt vời như vậy. Em mong hai chị em sẽ mãi gắn bó và yêu thương nhau.',
  ],
  // Viết đoạn văn nêu tình cảm, cảm xúc về nhân vật văn học
  '6a465c450074fdef48a91303': [
    'Trong các nhân vật văn học đã học, em yêu quý nhất là cô Tấm trong truyện "Tấm Cám". Tấm là cô gái mồ côi, hiền lành, chăm chỉ nhưng phải chịu nhiều thiệt thòi, cay đắng bởi mẹ con Cám. Dù bị hãm hại nhiều lần, Tấm vẫn không gục ngã mà kiên cường hóa thân qua bao hình hài để trở về. Em vừa thương xót cho số phận của Tấm, vừa khâm phục sức sống mãnh liệt và tấm lòng lương thiện của cô. Kết thúc truyện, Tấm được hưởng hạnh phúc xứng đáng khiến em rất vui. Nhân vật Tấm giúp em tin rằng người tốt sẽ luôn gặp điều lành.',
    'Nhân vật khiến em cảm động và yêu mến nhất là chú Rùa trong truyện "Rùa và Thỏ". Chú Rùa tuy chậm chạp và bị Thỏ coi thường nhưng lại có đức tính kiên trì, bền bỉ đáng quý. Trong cuộc thi chạy, Rùa không nản lòng trước sự nhanh nhẹn của Thỏ mà cứ chăm chỉ tiến bước, không ngừng nghỉ. Cuối cùng, chính sự kiên trì ấy đã giúp Rùa chiến thắng. Em rất khâm phục chú Rùa và học được bài học quý giá: chỉ cần chăm chỉ, nhẫn nại và không bỏ cuộc thì ai cũng có thể thành công. Chú Rùa mãi là tấm gương để em noi theo.',
    'Em vô cùng yêu quý nhân vật Thạch Sanh trong truyện cổ tích cùng tên. Thạch Sanh là chàng dũng sĩ tài giỏi, khỏe mạnh nhưng cũng vô cùng thật thà, tốt bụng. Chàng đã dũng cảm diệt chằn tinh, đại bàng để cứu người, không hề sợ hãi gian nguy. Đặc biệt, dù bị Lí Thông nhiều lần lừa gạt và hãm hại, Thạch Sanh vẫn giữ tấm lòng bao dung, sẵn sàng tha thứ. Em cảm phục lòng dũng cảm và trân trọng tấm lòng nhân hậu của chàng. Nhân vật Thạch Sanh dạy em bài học sống lương thiện, dũng cảm và luôn bao dung với mọi người.',
  ],
  // Viết đoạn văn nêu cảm xúc về một sự việc
  '6a465c450074fdef48a91304': [
    'Em vẫn nhớ mãi cảm giác vui sướng sau khi giúp một cụ già qua đường. Hôm ấy trên đường đi học về, em thấy một cụ bà tay chống gậy loay hoay không dám sang đường vì xe cộ đông đúc. Em liền chạy lại, lễ phép hỏi rồi dìu cụ đi qua. Khi sang đến nơi, cụ mỉm cười xoa đầu em và khen em ngoan. Lúc ấy, lòng em ngập tràn niềm vui khó tả. Em cảm thấy thật hạnh phúc vì đã làm được một việc tốt, dù nhỏ bé. Từ sự việc ấy, em hiểu rằng giúp đỡ người khác không chỉ mang lại niềm vui cho họ mà còn khiến chính mình thấy ấm áp trong lòng.',
    'Lần em nhặt được của rơi trả lại người mất là một kỉ niệm khiến em rất tự hào. Hôm đó, trên đường đi học, em nhặt được một chiếc ví rơi bên đường, bên trong có tiền và nhiều giấy tờ. Em suy nghĩ một lát rồi quyết định mang đến nhờ chú công an tìm người đánh mất. Một lúc sau, một cô đến nhận lại chiếc ví và cảm ơn em rối rít. Cô còn khen em thật thà, ngoan ngoãn. Em vui lắm và cảm thấy lòng mình thật nhẹ nhõm. Qua việc làm ấy, em hiểu rằng tính trung thực là điều rất đáng quý và luôn mang lại niềm vui cho mọi người.',
    'Buổi tham gia quyên góp giúp đỡ các bạn vùng lũ đã để lại trong em nhiều cảm xúc. Nghe tin đồng bào miền Trung chịu thiệt hại nặng nề vì bão lũ, cả trường em phát động phong trào ủng hộ. Em đã dành số tiền tiết kiệm của mình và quyên góp thêm quần áo, sách vở cũ còn lành lặn. Khi trao những món quà ấy, em thấy lòng mình ấm áp và xúc động vô cùng. Em mong những phần quà nhỏ bé sẽ phần nào giúp các bạn vơi bớt khó khăn. Sự việc ấy giúp em hiểu được ý nghĩa của tình yêu thương, sẻ chia "lá lành đùm lá rách" trong cuộc sống.',
  ],
  // Viết đoạn văn nêu ý kiến thích một câu chuyện
  '6a465c450074fdef48a91305': [
    'Trong những câu chuyện đã đọc, em thích nhất là truyện "Cây khế". Em thích câu chuyện này vì nó chứa đựng bài học sâu sắc về cách sống. Người em hiền lành, chăm chỉ nên được chim thần trả ơn và trở nên giàu có, còn người anh tham lam thì phải nhận lấy hậu quả. Câu chuyện còn hấp dẫn bởi những chi tiết kì ảo như con chim biết nói, hòn đảo đầy vàng bạc. Qua đó, em rút ra bài học "ở hiền gặp lành", phải sống lương thiện và không được tham lam. Chính vì ý nghĩa tốt đẹp ấy mà em rất yêu thích và nhớ mãi câu chuyện này.',
    'Câu chuyện mà em yêu thích nhất là "Rùa và Thỏ". Em thích truyện này vì nó tuy ngắn gọn nhưng lại dạy em một bài học quý giá. Chú Thỏ vì kiêu ngạo, chủ quan mà thua cuộc, còn chú Rùa nhờ kiên trì, bền bỉ nên đã giành chiến thắng. Câu chuyện giúp em hiểu rằng không nên coi thường người khác và cũng không được lười biếng, chủ quan. Chỉ cần chăm chỉ, nỗ lực không ngừng thì dù chậm mà chắc, ta vẫn sẽ đạt được thành công. Mỗi khi gặp khó khăn, em lại nhớ đến chú Rùa để tự nhắc mình phải cố gắng đến cùng.',
    'Em rất yêu thích câu chuyện "Sự tích cây vú sữa". Em thích truyện này vì nó vô cùng cảm động và giàu ý nghĩa. Câu chuyện kể về một cậu bé ham chơi, bỏ nhà đi khiến mẹ mòn mỏi chờ mong đến hóa thành cây. Chi tiết dòng sữa ngọt ngào chảy ra từ quả cây khiến em xúc động và thấm thía tình mẹ bao la. Câu chuyện nhắc nhở em phải biết yêu thương, hiếu thảo với cha mẹ khi còn có thể, đừng để đến khi hối hận thì đã muộn. Chính bài học ý nghĩa ấy đã khiến em nhớ mãi và yêu thích câu chuyện này.',
  ],
  // Viết đoạn văn nêu ý kiến tán thành hoặc phản đối một hiện tượng, sự việc gần gũi
  '6a465c450074fdef48a91306': [
    'Em hoàn toàn tán thành việc trồng thêm nhiều cây xanh trong trường học. Cây xanh mang lại rất nhiều lợi ích cho chúng ta. Trước hết, cây tỏa bóng mát, giúp sân trường trở nên râm mát vào những ngày hè oi bức. Cây xanh còn giúp không khí trong lành, giảm bụi bặm và tiếng ồn. Dưới bóng cây, chúng em có thể vui chơi, đọc sách trong giờ ra chơi. Ngoài ra, một ngôi trường nhiều cây xanh còn trở nên đẹp đẽ và gần gũi hơn. Vì vậy, em nghĩ mỗi bạn học sinh nên tích cực trồng và chăm sóc cây để ngôi trường của chúng ta ngày càng xanh, sạch, đẹp.',
    'Em phản đối việc các bạn học sinh ăn quà vặt trong lớp học. Đây là một thói quen không tốt cần phải thay đổi. Ăn quà vặt trong lớp làm mất vệ sinh, vương vãi rác bẩn ra bàn ghế, sàn nhà. Việc này còn làm các bạn mất tập trung, không chú ý nghe cô giảng bài. Hơn nữa, nhiều loại quà vặt không đảm bảo vệ sinh, dễ gây hại cho sức khỏe. Vì vậy, theo em, chúng ta không nên ăn quà vặt trong lớp. Thay vào đó, các bạn hãy ăn sáng đầy đủ ở nhà và giữ gìn lớp học luôn sạch sẽ, gọn gàng.',
    'Em tán thành việc đọc sách mỗi ngày, đây là một thói quen rất bổ ích. Đọc sách giúp chúng em mở mang kiến thức, hiểu biết thêm về thế giới xung quanh. Những cuốn sách hay còn nuôi dưỡng tâm hồn, dạy chúng em biết yêu thương và sống tốt đẹp hơn. Đọc sách thường xuyên cũng giúp em viết văn hay hơn và có thêm nhiều vốn từ. Ngoài ra, đọc sách còn là cách giải trí lành mạnh, giúp em thư giãn sau giờ học căng thẳng. Vì những lợi ích đó, em nghĩ mỗi bạn học sinh nên dành ra một khoảng thời gian mỗi ngày để đọc sách và xây dựng thói quen tốt đẹp này.',
  ],
  // Viết đoạn văn tưởng tượng dựa vào một câu chuyện đã đọc hoặc đã nghe
  '6a465c450074fdef48a91307': [
    'Em tưởng tượng một ngày nọ, em được gặp lại cô Tấm sau khi cô trở thành hoàng hậu. Trong khu vườn thượng uyển rực rỡ hoa lá, cô Tấm dịu dàng bước ra đón em. Cô vẫn hiền hậu và giản dị như xưa, ân cần hỏi han em về việc học hành. Em kể cho cô nghe rằng ai cũng yêu mến và cảm phục cô. Cô mỉm cười và khuyên em hãy luôn sống lương thiện, chăm chỉ thì nhất định sẽ gặp điều tốt lành. Được trò chuyện cùng cô Tấm, em cảm thấy vô cùng hạnh phúc và như tiếp thêm động lực để cố gắng trở thành người tốt.',
    'Em tưởng tượng mình được cùng Dế Mèn tham gia một chuyến phiêu lưu kì thú. Chúng em băng qua những cánh đồng cỏ xanh mướt, vượt suối trèo đèo để khám phá thế giới rộng lớn. Trên đường đi, Dế Mèn kể cho em nghe về những người bạn chú từng gặp và những bài học chú đã rút ra. Khi gặp một chú kiến nhỏ bị lạc, cả hai chúng em đã cùng nhau đưa chú kiến về tổ an toàn. Dế Mèn dạy em phải luôn dũng cảm và biết giúp đỡ người khác. Chuyến phiêu lưu tưởng tượng ấy khiến em thêm yêu quý nhân vật Dế Mèn và học được nhiều điều bổ ích.',
    'Em tưởng tượng mình được bước vào thế giới cổ tích và trò chuyện cùng chàng Thạch Sanh. Trong khu rừng xanh mát, chàng Thạch Sanh khỏe mạnh, hiền lành ngồi bên gốc đa gảy đàn. Tiếng đàn của chàng réo rắt, ngân nga khiến muông thú kéo đến lắng nghe. Em rụt rè đến gần và được chàng vui vẻ kể cho nghe về những chiến công diệt chằn tinh, cứu công chúa. Chàng khuyên em phải sống thật thà, dũng cảm và biết bao dung với mọi người. Được gặp gỡ người anh hùng mình yêu mến, em thấy thật vui sướng và tự hứa sẽ học tập những đức tính tốt đẹp của chàng.',
  ],
};

module.exports = { QUESTION_ANSWERS, EXERCISE_ESSAYS };
