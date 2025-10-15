create or replace function get_volunteer_patterns(p_family_id uuid)
returns table (character_id uuid, volunteer_count bigint) as $$
begin
  return query
  select
    qi.volunteered_by as character_id,
    count(*) as volunteer_count
  from quest_instances qi
  where qi.family_id = p_family_id and qi.volunteered_by is not null
  group by qi.volunteered_by
  order by volunteer_count desc;
end; $$ language plpgsql;
