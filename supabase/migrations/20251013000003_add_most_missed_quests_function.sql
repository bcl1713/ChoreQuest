create or replace function get_most_missed_quests(p_family_id uuid)
returns table (template_id uuid, missed_count bigint) as $$
begin
  return query
  select
    qi.template_id,
    count(*) filter (where qi.status = 'MISSED') as missed_count
  from quest_instances qi
  where qi.family_id = p_family_id and qi.template_id is not null
  group by qi.template_id
  order by missed_count desc
  limit 10;
end; $$ language plpgsql;
