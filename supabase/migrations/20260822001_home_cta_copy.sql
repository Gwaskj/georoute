-- Stop the home page implying that only free mode keeps data local.
--
-- The closing call to action read "Free mode runs in your browser and never
-- sends your data to our servers", which is true but reads as a free-tier
-- caveat -- exactly the impression the rest of the site now works to correct.
-- Every plan keeps client details in the browser, and that is the strongest
-- thing this page can say to a care provider.
--
-- Written as a targeted jsonb update rather than replacing the blocks array,
-- so anything Matthew has since edited in the page editor survives.

update public.page_content
   set blocks = (
         select jsonb_agg(
                  case
                    when block ->> 'type' = 'cta'
                      then jsonb_set(
                             block,
                             '{data,subtitle}',
                             to_jsonb(
                               'Build a schedule without creating an account. Your staff, clients and rounds stay in this browser on every plan — they never reach our servers.'::text
                             )
                           )
                    else block
                  end
                  order by ordinality
                )
           from jsonb_array_elements(blocks) with ordinality as t(block, ordinality)
       ),
       updated_at = now()
 where page_id = 'home'
   and blocks @> '[{"type":"cta"}]'::jsonb;
