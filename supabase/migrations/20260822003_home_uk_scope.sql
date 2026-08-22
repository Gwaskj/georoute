-- Say on the home page that GeoRoutes is for the UK.
--
-- The hero badge reads "For care, nursing and therapy teams", which is true
-- everywhere and therefore tells someone in Ohio nothing. Rounds are planned
-- from UK postcodes and cannot be planned from a ZIP code, so the sooner that
-- is known the better -- a visitor who cannot use the product should find out
-- in the first line rather than after building a schedule.
--
-- A targeted jsonb update rather than a replacement of the blocks array, so
-- anything since edited in the page editor survives.

update public.page_content
   set blocks = (
         select jsonb_agg(
                  case
                    when block ->> 'type' = 'hero'
                      then jsonb_set(
                             block,
                             '{data,badge}',
                             to_jsonb('For UK care, nursing and therapy teams'::text)
                           )
                    else block
                  end
                  order by ordinality
                )
           from jsonb_array_elements(blocks) with ordinality as t(block, ordinality)
       ),
       updated_at = now()
 where page_id = 'home'
   and blocks @> '[{"type":"hero"}]'::jsonb;
