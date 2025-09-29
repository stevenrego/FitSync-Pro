import { supabase } from './supabase';
import { Post, PostComment, Message } from '../types';

export const communityService = {
  // Posts
  async getPosts(): Promise<Post[]> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*),
        workout_session:workout_sessions(*),
        post_likes!left(user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map(post => ({
      ...post,
      is_liked: post.post_likes?.some((like: any) => like.user_id === user.user?.id) || false
    })) as Post[];
  },

  async createPost(content: string, imageUrls?: string[], workoutSessionId?: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.user?.id,
        content,
        image_urls: imageUrls,
        workout_session_id: workoutSessionId
      })
      .select(`
        *,
        user:profiles(*),
        workout_session:workout_sessions(*)
      `)
      .single();

    if (error) throw error;
    return { ...data, is_liked: false } as Post;
  },

  async likePost(postId: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.user?.id
      });

    if (error && error.code !== '23505') throw error; // Ignore unique constraint error

    // Update likes count
    const { error: updateError } = await supabase.rpc('increment_post_likes', {
      post_id: postId
    });

    if (updateError) throw updateError;
  },

  async unlikePost(postId: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.user?.id);

    if (error) throw error;

    // Update likes count
    const { error: updateError } = await supabase.rpc('decrement_post_likes', {
      post_id: postId
    });

    if (updateError) throw updateError;
  },

  // Comments
  async getPostComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as PostComment[];
  },

  async createComment(postId: string, content: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.user?.id,
        content
      })
      .select(`
        *,
        user:profiles(*)
      `)
      .single();

    if (error) throw error;

    // Update comments count
    const { error: updateError } = await supabase.rpc('increment_post_comments', {
      post_id: postId
    });

    if (updateError) throw updateError;

    return data as PostComment;
  },

  // Following
  async followUser(userId: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.user?.id,
        following_id: userId
      });

    if (error && error.code !== '23505') throw error; // Ignore unique constraint error
  },

  async unfollowUser(userId: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.user?.id)
      .eq('following_id', userId);

    if (error) throw error;
  },

  // Messages
  async getConversations() {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        recipient:profiles!messages_recipient_id_fkey(*)
      `)
      .or(`sender_id.eq.${user.user?.id},recipient_id.eq.${user.user?.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Message[];
  },

  async sendMessage(recipientId: string, content: string) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.user?.id,
        recipient_id: recipientId,
        content
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        recipient:profiles!messages_recipient_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data as Message;
  },

  async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    if (error) throw error;
  }
};