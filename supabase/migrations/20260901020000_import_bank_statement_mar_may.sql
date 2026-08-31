--
-- Data import: bank statement upload, parsed offline the same way
-- StatementUploadDialog.tsx does client-side (statementParser.ts's
-- column-anchor logic) since the file couldn't be uploaded through the
-- browser here. 136 transactions, 7 pages,
-- period 2026-03-08 to 2026-05-30.
--
-- One balance-mismatch was found (2026-03-24 "SMS Charges for FEB 26" --
-- expected balance 18233.51, statement shows 3233.51, a Rs 15,000 gap)
-- -- same as the app's own upload flow, mismatches are surfaced, not
-- silently trusted or blocked; imported as-is, flagged for the user to
-- check against the original PDF around that date.
--
-- Guarded with NOT EXISTS per row (matching date+description+amount) so
-- re-running this is safe and it won't duplicate any rows already
-- entered through the app's own upload UI.
-- One-off DATA import, not a schema change -- not mirrored into
-- supabase/schemas/.
--

with import_row as (
  insert into public.statement_imports (filename, period_from, period_to, transaction_count, sales_id)
  values ('XXXXXXXXXX0309_20260831185439084786.pdf', '2026-03-08', '2026-05-30', 136, 1)
  returning id
),
new_rows(date, description, amount, balance_after) as (
  values
  ('2026-03-08', 'NEFT-002611378851-RAJ INFORAMATION SYSTEM PVT LT', 7840, 7964.75),
  ('2026-03-12', 'UPI/643738693925/00:02:23/UPI/paytmqr9l9opb9fco @p', -30, 7934.75),
  ('2026-03-12', 'UPI/607177708580/10:40:10/UPI/yusufmundrawala02 71', -2100, 5834.75),
  ('2026-03-15', 'UPI/607419676213/17:57:46/UPI/murtaza0048- 4@okici', -1000, 4834.75),
  ('2026-03-19', 'UPI/607822209075/16:26:13/UPI/sakina0046- 1@okaxis', -1, 4833.75),
  ('2026-03-21', 'UPI/644689636093/22:32:49/UPI/sujitkhimsuriya2@ok', -2000, 2833.75),
  ('2026-03-22', 'UPI/644715956245/12:15:57/UPI/merkaushikbhimjibha', -900, 1933.75),
  ('2026-03-22', 'UPI/644752057245/12:27:12/UPI/kalanirajesh1@okici', -1000, 933.75),
  ('2026-03-23', 'UPI/608243967042/22:05:28/UPI/elearningquran.payu', -200, 733.75),
  ('2026-03-23', 'UPI/608266982837/22:18:27/UPI/murtaza0048- 4@okici', 17500, 18233.75),
  ('2026-03-24', 'SMS Charges for FEB 26', -0.24, 3233.51),
  ('2026-03-26', 'UPI/608571222678/08:59:43/UPI/agabu600@okicici/U P', 20, 3253.51),
  ('2026-03-28', 'UPI/645307568090/10:06:24/UPI/rmcorp.bdpg@kotak pa', -670, 2583.51),
  ('2026-03-28', 'UPI/645378084468/12:46:38/UPI/amazon@rapl/You are', -904, 1679.51),
  ('2026-03-28', 'UPI/645358187167/14:53:01/UPI/dipakrangpara099@ ok', 10, 1689.51),
  ('2026-03-28', 'UPI/645364893084/14:54:27/UPI/dipakrangpara099@ ok', 5, 1694.51),
  ('2026-03-28', 'UPI/608726935992/23:27:10/UPI/q025734464@ybl/U PI', -150, 1544.51),
  ('2026-03-29', 'UPI/608844446260/14:50:32/UPI/paytmqr60bhmy@pt ys/', -100, 1444.51),
  ('2026-03-29', 'UPI/608868261089/15:32:44/UPI/sabirodiyasabit@oks', -600, 844.51),
  ('2026-03-29', 'UPI/608859475203/15:42:21/UPI/kishandostyi@okhdf c', -150, 694.51),
  ('2026-03-29', 'UPI/608862147710/15:51:03/UPI/sahbazchopda269@ oki', -150, 544.51),
  ('2026-03-29', 'UPI/608836071217/16:07:18/UPI/parmarrahul0612@o ks', -290, 254.51),
  ('2026-03-29', 'UPI/608836565441/16:10:51/UPI/sahistasama2@okhd fc', -20, 234.51),
  ('2026-03-29', 'UPI/645455500144/17:09:10/UPI/sakina0046- 1@okaxis', 300, 534.51),
  ('2026-03-29', 'UPI/608865680727/17:10:18/UPI/sakina0046- 1@okicic', 50, 584.51),
  ('2026-03-29', 'UPI/608857688675/17:25:44/UPI/dmart.27321717@hd fc', -549, 35.51),
  ('2026-03-30', 'UPI/645566552184/13:16:41/UPI/hashmisakil- 3@okaxi', 6, 41.51),
  ('2026-03-30', 'UPI/645549920453/15:51:33/UPI/solankijaydip976-2@', 20, 61.51),
  ('2026-03-30', 'UPI/645543134328/17:22:37/UPI/soniashish20008@o ki', 500, 561.51),
  ('2026-03-30', 'UPI/581466967598/17:24:49/UPI/9687937871@axl/Pa ym', 900, 1461.51),
  ('2026-03-30', 'UPI/645571041278/17:56:08/UPI/rmcorp.bdpg@kotak pa', -670, 791.51),
  ('2026-03-30', 'UPI/645518352147/18:40:45/UPI/rmcorp.bdpg@kotak pa', -670, 121.51),
  ('2026-03-31', 'UPI/645692573657/07:25:47/UPI/rajkotrajpathlt7486', -25, 96.51),
  ('2026-03-31', 'UPI/645671186824/08:40:52/UPI/bharatpe.8i0k0u8i6b', -17, 79.51),
  ('2026-03-31', 'UPI/645650669926/08:43:27/UPI/bharatpe.8i0k0u8i6b', -20, 59.51),
  ('2026-03-31', 'UPI/609083126018/09:09:49/UPI/hasansameja95@ok sbi', 5, 64.51),
  ('2026-04-03', 'UPI/609369307720/09:01:27/UPI/nayangamara2002@ oki', 10, 74.51),
  ('2026-04-04', 'UPI/609441712287/11:05:57/UPI/sumitpatil3190@oka x', 800, 874.51),
  ('2026-04-04', 'UPI/121052227460/11:40:32/UPI/manjubenjayantibhai', 24, 898.51),
  ('2026-04-04', 'UPI/646070823702/15:34:58/UPI/shubhamsiddhpura7 77', 10, 908.51),
  ('2026-04-05', 'UPI/609533291482/12:30:05/UPI/thkorjay107-3@oksbi', 99, 1007.51),
  ('2026-04-05', 'UPI/609570402385/19:42:43/UPI/paytmqr60bhmz@pt ys/', -100, 907.51),
  ('2026-04-06', 'UPI/609615524644/10:05:23/UPI/jayrajzala877@okici', 15, 922.51),
  ('2026-04-06', 'UPI/609601660536/12:50:08/UPI/zankatanil9875@oks b', 10, 932.51),
  ('2026-04-06', 'UPI/121172274788/16:30:01/UPI/rasmeetjadiya2004 @o', 38, 970.51),
  ('2026-04-07', 'UPI/609751493421/08:45:31/UPI/sb045848- 1@oksbi/UP', 20, 990.51),
  ('2026-04-07', 'UPI/674345890976/10:15:04/UPI/poweraccess.one36 89', 986.65, 1977.16),
  ('2026-04-07', 'NEFT-002671273294-RAJ INFORAMATION SYSTEM PVT LT', 7840, 9817.16),
  ('2026-04-07', 'UPI/646327828745/14:36:11/UPI/409001177726@ratn 00', -3000, 6817.16),
  ('2026-04-07', 'UPI/646356964207/19:01:19/UPI/sakina0046- 1@okaxis', -5000, 1817.16),
  ('2026-04-07', 'UPI/646387472527/20:31:12/UPI/9979015852@pthdfc /U', -400, 1417.16),
  ('2026-04-08', 'UPI/800014290986/02:31:48/UPI/goog- payments@axisb', 1, 1418.16),
  ('2026-04-08', 'UPI/646485995889/11:13:21/UPI/9979015852@pthdfc /U', -200, 1218.16),
  ('2026-04-08', 'UPI/300305531822/MAN/07042026', 20, 1238.16),
  ('2026-04-08', 'UPI/264805597598/20:57:29/UPI/9974386054@ybl/Pa ym', 15, 1253.16),
  ('2026-04-10', 'UPI/646630851733/12:15:35/UPI/rajkotrajpathlt7486', -25, 1228.16),
  ('2026-04-10', 'UPI/610057059050/12:44:03/UPI/rajujoshi0066@oksbi', 200, 1428.16),
  ('2026-04-10', 'UPI/646655448741/13:05:32/UPI/bharatpe.8i0k0u8i6b', -10, 1418.16),
  ('2026-04-10', 'UPI/646675153971/13:12:17/UPI/bharatpe.8i0k0u8i6b', -5, 1413.16),
  ('2026-04-10', 'UPI/646673393832/19:21:43/UPI/bharatpe.8e0p1t1s6c', -5, 1408.16),
  ('2026-04-11', 'UPI/610127671056/20:27:23/UPI/rushantranpara64- 2@', 500, 1908.16),
  ('2026-04-12', 'UPI/646874915303/10:34:58/UPI/bharatpe.8e0p1t1s6c', -5, 1903.16),
  ('2026-04-12', 'UPI/646833822547/12:46:47/UPI/sanjuddegama- 1@oksb', -400, 1503.16),
  ('2026-04-13', 'UPI/646975762581/08:56:50/UPI/vanrajsinh.chudasm a', -500, 1003.16),
  ('2026-04-13', 'UPI/610318223507/09:47:29/UPI/sabirqorsi@okaxis/U', 300, 1303.16),
  ('2026-04-13', 'UPI/646946786214/11:01:36/UPI/9372824999@ybl/U PI', -350, 953.16),
  ('2026-04-13', 'UPI/121530173876/13:33:11/UPI/riskygadhavi007- 1@o', 920, 1873.16),
  ('2026-04-14', 'UPI/647029607015/22:33:24/UPI/murtaza0048- 4@okici', -700, 1173.16),
  ('2026-04-16', 'UPI/610686933819/16:28:36/UPI/bharatpe.8y0h1t1j8q', -70, 1103.16),
  ('2026-04-16', 'UPI/610604734667/16:51:05/UPI/bharatpe.8y0h1t1j8q', -99, 1004.16),
  ('2026-04-18', 'UPI/647415310595/11:01:17/UPI/sumitpatil3190@oka x', 1185, 2189.16),
  ('2026-04-18', 'UPI/647438735121/11:12:00/UPI/murtaza0048- 4@okici', -1185, 1004.16),
  ('2026-04-20', 'UPI/611016083919/11:40:55/UPI/murtaza0048- 4@okici', -500, 504.16),
  ('2026-04-22', 'UPI/611274763939/17:56:02/UPI/murtaza0048- 4@okici', 830, 1334.16),
  ('2026-04-22', 'UPI/611266570505/20:04:30/UPI/soniashish20008@o ki', 500, 1834.16),
  ('2026-04-22', 'UPI/611260896145/20:06:07/UPI/elearningquran.payu', -1550, 284.16),
  ('2026-04-22', 'UPI/611275994908/20:06:51/UPI/elearningquran.payu', -200, 84.16),
  ('2026-04-27', 'UPI/648303166646/09:18:00/UPI/gotkahozefa1@okici c', 1900, 1984.16),
  ('2026-04-27', 'UPI/648331974427/09:25:17/UPI/passportseva.goi.sb', -1500, 484.16),
  ('2026-04-30', 'UPI/301727567232/21:23:41/UPI/9979015852@ptyes/ Se', 5000, 5484.16),
  ('2026-04-30', 'UPI/612041648026/23:34:48/UPI/paytmqr191msr8coc @p', -100, 5384.16),
  ('2026-05-02', 'UPI/648852335197/07:46:07/UPI/q255486026@ybl/U PI', -55, 5329.16),
  ('2026-05-02', 'UPI/648841559713/11:44:22/UPI/gilanikarmali1-2@ok', -55, 5274.16),
  ('2026-05-03', 'UPI/612379204176/18:01:10/UPI/aryanhudad422- 4@oka', 500, 5774.16),
  ('2026-05-04', '78020100010309:Int.Pd:01-02-2026 to 30-04-2026', 13, 5787.16),
  ('2026-05-04', 'UPI/649039525916/21:07:29/UPI/bharatpe.9o0x0s0a2 p', -15, 5772.16),
  ('2026-05-05', 'UPI/649130149395/02:24:35/UPI/paytm- 75958587@ptys', -100, 5672.16),
  ('2026-05-06', 'UPI/612628960548/20:18:14/UPI/bharatpe.9d0p0e0l7 p', -80, 5592.16),
  ('2026-05-07', 'UPI/649345016445/09:35:25/UPI/paytm.s14h4ey@pty/ U', -200, 5392.16),
  ('2026-05-09', 'UPI/612925475678/18:37:12/UPI/paytmqr6ut0p1@pty s/', -600, 4792.16),
  ('2026-05-10', 'UPI/649600456067/18:03:51/UPI/parmarrahul0612@o ks', -150, 4642.16),
  ('2026-05-10', 'UPI/649646072541/18:57:44/UPI/paytmqr69a0j9@pty s/', -15, 4627.16),
  ('2026-05-11', 'UPI/649739287486/07:51:53/UPI/cf.irctc@cashfreens', -456.8, 4170.36),
  ('2026-05-11', 'UPI/613156504812/08:07:31/UPI/makemytriprails1onl', -689.7, 3480.66),
  ('2026-05-11', 'UPI/613191506566/11:23:35/UPI/paytm.s14h4ey@pty/ U', -100, 3380.66),
  ('2026-05-12', 'UPI/649859118165/18:27:41/UPI/paytm.s1s4cw7@pty /U', -100, 3280.66),
  ('2026-05-14', 'UPI/613476795701/23:27:14/UPI/murtaza0048- 4@okici', -3000, 280.66),
  ('2026-05-15', 'UPI/613528293183/09:41:21/UPI/paytm.s14h4ey@pty/ U', -100, 180.66),
  ('2026-05-15', 'UPI/650188918322/17:31:47/UPI/babwanirahil- 5@okax', 5595, 5775.66),
  ('2026-05-15', 'UPI/650192766534/21:51:58/UPI/meesho1online.gpay @', -188, 5587.66),
  ('2026-05-16', 'SMS Charges for APR 26', -0.24, 5587.42),
  ('2026-05-16', 'UPI/650271196659/10:52:44/UPI/paytmqr572ssq@pa ytm', -1350, 4237.42),
  ('2026-05-16', 'UPI/613644513655/17:56:51/UPI/sakina0046- 1@okaxis', 1000, 5237.42),
  ('2026-05-16', 'UPI/613679407099/19:08:28/UPI/q033972211@ybl/sp ec', -900, 4337.42),
  ('2026-05-16', 'UPI/613625028102/20:02:21/UPI/paytm.s20kjle@pty/ U', -20, 4317.42),
  ('2026-05-17', 'UPI/613735360409/09:12:14/UPI/mswipe.1400090424 00', -100, 4217.42),
  ('2026-05-17', 'UPI/613774088359/19:15:35/UPI/godhrawalaburhan53 5', -300, 3917.42),
  ('2026-05-17', 'UPI/650332203947/20:12:58/UPI/gpay- 12191067306@ok', -10, 3907.42),
  ('2026-05-17', 'UPI/650394613566/21:20:52/UPI/9316744151@upi/U PI', -100, 3807.42),
  ('2026-05-18', 'UPI/650458974465/19:53:43/UPI/paytmqr69fawi@ptys /', -100, 3707.42),
  ('2026-05-20', 'UPI/614033279491/09:11:13/UPI/9979015852@pthdfc /U', -500, 3207.42),
  ('2026-05-21', 'UPI/650741949829/09:38:53/UPI/paytm.s14h4ey@pty/ U', -200, 3007.42),
  ('2026-05-22', 'UPI/667714181436/00:24:18/UPI/storymax.cfp@axisb a', -1, 3006.42),
  ('2026-05-23', 'UPI/614356499846/11:41:07/UPI/paytm.s25dlz9@pty/ U', -10, 2996.42),
  ('2026-05-23', 'UPI/650981603452/15:09:59/UPI/sabirbelim2861@okh d', -25, 2971.42),
  ('2026-05-23', 'UPI/650995857717/20:22:12/UPI/paytmqr6u3tp5@pty s/', -14, 2957.42),
  ('2026-05-23', 'UPI/650994844499/20:23:09/UPI/paytmqr6u3tp5@pty s/', -20, 2937.42),
  ('2026-05-24', 'UPI/651038663154/08:33:10/UPI/q276017769@ybl/na sh', -115, 2822.42),
  ('2026-05-24', 'UPI/651089472269/08:59:37/UPI/9930684641- 1@okbiza', -101, 2721.42),
  ('2026-05-24', 'UPI/651062676220/12:30:21/UPI/ujjavaltiwari1999@o', -121, 2600.42),
  ('2026-05-24', 'UPI/651028893980/15:23:27/UPI/pinelabs.stq3787614', -50, 2550.42),
  ('2026-05-24', 'UPI/651011389710/15:30:10/UPI/phoenixmumbaichick i', -291.9, 2258.52),
  ('2026-05-24', 'UPI/651026394609/17:46:01/UPI/paytmqr6fd9e0@pty s/', -82, 2176.52),
  ('2026-05-24', 'UPI/614437703784/18:10:25/UPI/q24396491@ybl/UPI', -20, 2156.52),
  ('2026-05-24', 'UPI/651051489316/18:29:52/UPI/railsbiupi11.805241', -10, 2146.52),
  ('2026-05-24', 'UPI/614408119875/19:16:39/UPI/roppentransport1104', -29, 2117.52),
  ('2026-05-24', 'UPI/614430120235/20:30:31/UPI/gpay- 12195998129@ok', -150, 1967.52),
  ('2026-05-24', 'UPI/614455038479/20:55:53/UPI/ansarishakeel6718@ o', -40, 1927.52),
  ('2026-05-24', 'UPI/614411319127/21:20:01/UPI/paytmqr61lo1a@pty s/', -14, 1913.52),
  ('2026-05-26', 'UPI/651252717991/13:01:25/UPI/q348812613@ybl/U PI', -20, 1893.52),
  ('2026-05-26', 'UPI/651281640154/19:50:05/UPI/paytm.s1s4d7r@pty/ U', -200, 1693.52),
  ('2026-05-27', 'UPI/651344380431/08:19:20/UPI/elearningquran.payu', -1550, 143.52),
  ('2026-05-28', 'UPI/614820751816/13:29:45/UPI/q348812613@ybl/U PI', -10, 133.52),
  ('2026-05-29', 'UPI/651570724176/13:15:47/UPI/q348812613@ybl/U PI', -20, 113.52),
  ('2026-05-30', 'UPI/914977823650/09:42:48/UPI/murtazamundrawala @y', 200, 313.52),
  ('2026-05-30', 'UPI/651621797575/09:44:47/UPI/paytm.s14h4ey@pty/ U', -100, 213.52)
)
insert into public.transactions (date, description, amount, balance_after, source, statement_import_id)
select nr.date::date, nr.description, nr.amount, nr.balance_after, 'statement', import_row.id
from new_rows nr, import_row
where not exists (
  select 1 from public.transactions t
  where t.date = nr.date::date
    and t.description = nr.description
    and abs(t.amount - nr.amount) < 0.01
);
