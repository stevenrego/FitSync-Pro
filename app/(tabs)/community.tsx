import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  const posts = [
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=50&h=50&fit=crop&crop=face',
        verified: true,
      },
      content: 'Just crushed my morning workout! 💪 Feeling stronger every day. Who else is hitting the gym today?',
      image: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=400&h=300&fit=crop',
      likes: 24,
      comments: 8,
      time: '2h ago',
      liked: false,
    },
    {
      id: '2',
      user: {
        name: 'Mike Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
        verified: false,
      },
      content: 'Week 4 of my transformation journey! Down 8 pounds and feeling amazing. The FitSync community motivation is incredible! 🔥',
      likes: 56,
      comments: 12,
      time: '4h ago',
      liked: true,
    },
    {
      id: '3',
      user: {
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
        verified: true,
      },
      content: 'Meal prep Sunday complete! 🥗 This week is going to be all about clean eating and consistency.',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
      likes: 31,
      comments: 6,
      time: '6h ago',
      liked: false,
    },
  ];

  const challenges = [
    {
      title: '30-Day Plank Challenge',
      participants: 156,
      daysLeft: 12,
      joined: true,
    },
    {
      title: '10K Steps Daily',
      participants: 89,
      daysLeft: 5,
      joined: false,
    },
    {
      title: 'Hydration Hero',
      participants: 234,
      daysLeft: 20,
      joined: true,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="search" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="notifications" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.challengesContainer}
          >
            {challenges.map((challenge, index) => (
              <TouchableOpacity key={index} style={styles.challengeCard}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeParticipants}>
                  {challenge.participants} participants
                </Text>
                <Text style={styles.challengeDays}>
                  {challenge.daysLeft} days left
                </Text>
                <View style={[
                  styles.challengeStatus,
                  { backgroundColor: challenge.joined ? Colors.success : Colors.primary }
                ]}>
                  <Text style={styles.challengeStatusText}>
                    {challenge.joined ? 'Joined' : 'Join'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Create Post */}
        <TouchableOpacity style={styles.createPost}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=50&h=50&fit=crop&crop=face' }}
            style={styles.userAvatar}
          />
          <Text style={styles.createPostText}>Share your fitness journey...</Text>
          <MaterialIcons name="camera-alt" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Feed</Text>
          
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
                  <View style={styles.userDetails}>
                    <View style={styles.userName}>
                      <Text style={styles.nameText}>{post.user.name}</Text>
                      {post.user.verified && (
                        <MaterialIcons name="verified" size={16} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <MaterialIcons name="more-horiz" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Post Content */}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Post Image */}
              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              )}

              {/* Post Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons 
                    name={post.liked ? "favorite" : "favorite-border"} 
                    size={24} 
                    color={post.liked ? Colors.error : Colors.textSecondary} 
                  />
                  <Text style={styles.actionText}>{post.likes}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="chat-bubble-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="share" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
                  <MaterialIcons name="bookmark-border" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Suggested Friends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested for You</Text>
          
          {[
            {
              name: 'Alex Kumar',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
              mutual: 5,
              activity: 'Started following FitSync',
            },
            {
              name: 'Lisa Wang',
              avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
              mutual: 12,
              activity: 'Completed 50 workouts',
            },
          ].map((person, index) => (
            <View key={index} style={styles.suggestionCard}>
              <Image source={{ uri: person.avatar }} style={styles.suggestionAvatar} />
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>{person.name}</Text>
                <Text style={styles.suggestionMutual}>
                  {person.mutual} mutual connections
                </Text>
                <Text style={styles.suggestionActivity}>{person.activity}</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.md,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: Sizes.sm,
    marginLeft: Sizes.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: Sizes.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.md,
    paddingHorizontal: Sizes.lg,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Sizes.lg,
    marginBottom: Sizes.md,
  },
  seeAll: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  challengesContainer: {
    paddingLeft: Sizes.lg,
    gap: Sizes.md,
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    width: 160,
  },
  challengeTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  challengeParticipants: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  challengeDays: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Sizes.md,
  },
  challengeStatus: {
    paddingVertical: Sizes.xs,
    paddingHorizontal: Sizes.sm,
    borderRadius: Sizes.sm,
    alignItems: 'center',
  },
  challengeStatusText: {
    color: 'white',
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  createPost: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Sizes.lg,
    marginBottom: Sizes.xl,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Sizes.md,
  },
  createPostText: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  postCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Sizes.lg,
    marginBottom: Sizes.md,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Sizes.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  nameText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Sizes.xs,
  },
  postTime: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  postContent: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Sizes.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Sizes.sm,
    marginBottom: Sizes.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Sizes.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Sizes.lg,
  },
  actionText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: Sizes.xs,
  },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Sizes.lg,
    marginBottom: Sizes.md,
  },
  suggestionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Sizes.md,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  suggestionMutual: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  suggestionActivity: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Sizes.xs,
    paddingHorizontal: Sizes.md,
    borderRadius: Sizes.sm,
  },
  followButtonText: {
    color: 'white',
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
});