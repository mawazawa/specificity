create policy "Users can delete their own specs"
  on public.specifications for delete
  using (auth.uid() = user_id);
